<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Throttle counters live in the cache and would otherwise carry from
        // one test method into the next.
        Cache::flush();
    }

    /** @return array<string, mixed> */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'email'                 => 'nancy@example.test',
            'password'              => 'a-strong-secret-1',
            'password_confirmation' => 'a-strong-secret-1',
            'first_name'            => 'Nancy',
            'last_name'             => 'John',
            'date_of_birth'         => '1996-06-11',
            'phone'                 => '+2348165626483',
            'country'               => 'US',
            'street'                => 'No 2 wink road',
            'city'                  => 'Los Angeles',
            'state'                 => 'CA',
            'postal_code'           => '19709',
            'terms'                 => true,
        ], $overrides);
    }

    public function test_the_registration_screen_renders(): void
    {
        $this->get('/register')->assertOk();
    }

    public function test_registration_can_be_closed_by_configuration(): void
    {
        config(['registration.enabled' => false]);

        $this->get('/register')->assertNotFound();
        $this->post('/register', $this->payload())->assertNotFound();
    }

    public function test_a_signed_in_client_is_redirected_away(): void
    {
        $user = User::create([
            'name' => 'Existing', 'username' => 'existing',
            'email' => 'existing@example.test', 'password' => 'password', 'role' => 'user',
        ]);

        $this->actingAs($user)->get('/register')->assertRedirect();
    }

    public function test_an_account_is_created_and_signed_in(): void
    {
        $this->post('/register', $this->payload())
            ->assertRedirect('/user/dashboard')
            ->assertSessionHas('success');

        $user = User::where('email', 'nancy@example.test')->firstOrFail();

        $this->assertAuthenticatedAs($user);
        $this->assertSame('Nancy John', $user->name);
        $this->assertSame('user', $user->role);
        // Self-registration never credits a balance.
        $this->assertSame('0.00', $user->balance);
        $this->assertNotNull($user->terms_accepted_at);
    }

    public function test_the_password_is_hashed(): void
    {
        $this->post('/register', $this->payload());

        $user = User::where('email', 'nancy@example.test')->firstOrFail();

        $this->assertNotSame('a-strong-secret-1', $user->getAuthPassword());
        $this->assertTrue(Hash::check('a-strong-secret-1', $user->getAuthPassword()));
    }

    public function test_the_address_is_stored_structured_and_composed(): void
    {
        $this->post('/register', $this->payload());

        $user = User::where('email', 'nancy@example.test')->firstOrFail();

        // The subdivision code is expanded to its name before storage.
        $this->assertSame('California', $user->state);
        $this->assertSame('United States', $user->country);
        $this->assertSame(
            'No 2 wink road, Los Angeles, California 19709, United States',
            $user->address,
        );
    }

    public function test_a_member_id_is_generated(): void
    {
        $this->post('/register', $this->payload());

        $user = User::where('email', 'nancy@example.test')->firstOrFail();

        $this->assertMatchesRegularExpression('/^GCC-[A-Z0-9]{8}$/', $user->member_id);
    }

    public function test_usernames_derived_from_the_same_email_local_part_stay_unique(): void
    {
        $this->post('/register', $this->payload(['email' => 'nancy@example.test']));
        auth()->logout();
        $this->post('/register', $this->payload(['email' => 'nancy@other.test']));

        $first  = User::where('email', 'nancy@example.test')->firstOrFail();
        $second = User::where('email', 'nancy@other.test')->firstOrFail();

        $this->assertSame('nancy', $first->username);
        $this->assertSame('nancy2', $second->username);
    }

    public function test_a_referral_code_links_the_referrer(): void
    {
        $this->post('/register', $this->payload());
        $referrer = User::where('email', 'nancy@example.test')->firstOrFail();
        auth()->logout();

        // Lower case on purpose — the code is normalised before lookup.
        $this->post('/register', $this->payload([
            'email'         => 'friend@example.test',
            'referral_code' => strtolower($referrer->member_id),
        ]));

        $friend = User::where('email', 'friend@example.test')->firstOrFail();

        $this->assertSame($referrer->id, $friend->referred_by);
        $this->assertSame(1, $referrer->referrals()->count());
    }

    public function test_an_unknown_referral_code_is_ignored_rather_than_blocking_signup(): void
    {
        $this->post('/register', $this->payload(['referral_code' => 'GCC-NOTREAL']))
            ->assertRedirect('/user/dashboard');

        $this->assertNull(User::where('email', 'nancy@example.test')->firstOrFail()->referred_by);
    }

    public function test_a_duplicate_email_is_rejected(): void
    {
        $this->post('/register', $this->payload());
        auth()->logout();

        $this->post('/register', $this->payload())->assertSessionHasErrors('email');

        $this->assertSame(1, User::where('email', 'nancy@example.test')->count());
    }

    public function test_the_password_must_be_confirmed(): void
    {
        $this->post('/register', $this->payload(['password_confirmation' => 'something-else']))
            ->assertSessionHasErrors('password');

        $this->assertGuest();
    }

    public function test_a_short_password_is_rejected(): void
    {
        $this->post('/register', $this->payload([
            'password' => 'short', 'password_confirmation' => 'short',
        ]))->assertSessionHasErrors('password');
    }

    public function test_an_applicant_under_the_minimum_age_is_rejected(): void
    {
        $this->post('/register', $this->payload([
            'date_of_birth' => now()->subYears(17)->toDateString(),
        ]))->assertSessionHasErrors('date_of_birth');

        $this->assertGuest();
    }

    public function test_an_applicant_over_the_minimum_age_is_accepted(): void
    {
        $this->post('/register', $this->payload([
            'date_of_birth' => now()->subYears(18)->subDay()->toDateString(),
        ]))->assertSessionHasNoErrors();
    }

    public function test_the_terms_must_be_accepted(): void
    {
        $this->post('/register', $this->payload(['terms' => false]))
            ->assertSessionHasErrors('terms');

        $this->assertGuest();
    }

    public function test_a_country_outside_the_accepted_list_is_rejected(): void
    {
        $this->post('/register', $this->payload(['country' => 'ZZ']))
            ->assertSessionHasErrors('country');
    }

    public function test_trimming_the_country_list_closes_registration_from_there(): void
    {
        config(['locations.countries' => ['CA' => 'Canada']]);

        $this->post('/register', $this->payload(['country' => 'US']))
            ->assertSessionHasErrors('country');
    }

    public function test_required_fields_are_enforced(): void
    {
        $this->post('/register', [])->assertSessionHasErrors([
            'email', 'password', 'first_name', 'last_name',
            'date_of_birth', 'phone', 'country', 'street',
            'city', 'state', 'postal_code', 'terms',
        ]);
    }

    public function test_a_self_registered_client_can_sign_in_with_their_email(): void
    {
        $this->post('/register', $this->payload());
        auth()->logout();

        $this->post('/login', [
            'username' => 'nancy@example.test',
            'password' => 'a-strong-secret-1',
        ])->assertRedirect('/user/dashboard');

        $this->assertAuthenticated();
    }

    public function test_an_admin_created_client_can_still_sign_in_with_their_username(): void
    {
        User::create([
            'name'     => 'Desk Client',
            'username' => 'deskclient',
            'email'    => 'desk@example.test',
            'password' => 'a-strong-secret-1',
            'role'     => 'user',
        ]);

        $this->post('/login', [
            'username' => 'deskclient',
            'password' => 'a-strong-secret-1',
        ])->assertRedirect('/user/dashboard');

        $this->assertAuthenticated();
    }

    public function test_repeated_signup_attempts_are_throttled(): void
    {
        for ($attempt = 0; $attempt < 6; $attempt++) {
            $this->post('/register', $this->payload(['email' => "spam{$attempt}@example.test"]));
            auth()->logout();
        }

        $this->post('/register', $this->payload(['email' => 'spam99@example.test']))
            ->assertStatus(429);

        $this->assertDatabaseMissing('users', ['email' => 'spam99@example.test']);
    }

    public function test_repeated_failed_sign_ins_are_throttled(): void
    {
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $this->post('/login', ['username' => 'victim@example.test', 'password' => "guess{$attempt}"]);
        }

        $this->post('/login', ['username' => 'victim@example.test', 'password' => 'guess-again'])
            ->assertStatus(429);
    }

    public function test_bad_credentials_are_refused(): void
    {
        $this->post('/register', $this->payload());
        auth()->logout();

        $this->post('/login', [
            'username' => 'nancy@example.test',
            'password' => 'wrong-password',
        ])->assertSessionHasErrors('username');

        $this->assertGuest();
    }
}
