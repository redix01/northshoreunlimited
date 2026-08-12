<?php

namespace Tests\Feature;

use App\Models\Deposit;
use App\Models\Setting;
use App\Models\User;
use App\Models\UserDocument;
use App\Services\AccountSummary;
use App\Services\MarketData;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The wallet card quotes the top-up run's rate, set here rather than
        // through config so display and payout cannot drift apart.
        Setting::put('daily_topup_percent', 1.5);

        config([
            'markets.live'             => false,
            'markets.base'             => 'BTC',
            'markets.assets'           => [
                ['symbol' => 'BTC', 'name' => 'Bitcoin', 'id' => 'bitcoin', 'price' => 66400.00, 'change' => 0.0],
            ],
        ]);
    }

    private function client(array $overrides = []): User
    {
        $user = User::create(array_merge([
            'name'          => 'David Martini Fauteux',
            'username'      => 'dmartin',
            'email'         => 'client@example.test',
            'password'      => 'password',
            'role'          => 'user',
            'balance'       => 26316751.09,
            'phone'         => '5087637545',
            'address_line1' => '174 Union Street',
            'city'          => 'New Bedford',
            'state'         => 'MA',
            'postal_code'   => '02740',
            'country'       => 'United States',
            'date_of_birth' => '1954-02-24',
            'tax_id'        => '8554',
            'is_verified'   => true,
        ], $overrides));

        Deposit::create([
            'user_id'  => $user->id,
            'amount'   => 4050400.00,
            'currency' => 'BTC',
            'status'   => 'approved',
        ]);

        return $user->fresh();
    }

    public function test_the_profile_screen_renders(): void
    {
        $this->actingAs($this->client())
            ->get('/user/profile')
            ->assertOk();
    }

    public function test_the_address_is_composed_from_its_parts(): void
    {
        $this->assertSame(
            '174 Union Street, New Bedford, MA 02740, United States',
            $this->client()->formattedAddress(),
        );
    }

    public function test_a_partial_address_omits_the_missing_parts(): void
    {
        $user = $this->client(['state' => null, 'postal_code' => null, 'country' => null]);

        $this->assertSame('174 Union Street, New Bedford', $user->formattedAddress());
    }

    public function test_updating_the_profile_keeps_the_legacy_address_column_in_step(): void
    {
        $user = $this->client();

        $this->actingAs($user)
            ->from('/user/profile')
            ->post('/user/profile', [
                'name'          => 'David Martini Fauteux',
                'address_line1' => '9 Harbour Way',
                'city'          => 'Fairhaven',
                'state'         => 'MA',
                'postal_code'   => '02719',
                'country'       => 'United States',
                'pep_status'    => false,
            ])
            ->assertRedirect('/user/profile')
            ->assertSessionHas('success');

        $this->assertSame(
            '9 Harbour Way, Fairhaven, MA 02719, United States',
            $user->fresh()->address,
        );
    }

    public function test_only_four_tax_id_digits_are_accepted(): void
    {
        $user = $this->client();

        $this->actingAs($user)
            ->post('/user/profile', ['name' => $user->name, 'tax_id' => '123456789'])
            ->assertSessionHasErrors('tax_id');

        $this->assertSame('8554', $user->fresh()->tax_id);
    }

    public function test_an_omitted_tax_id_leaves_the_stored_digits_alone(): void
    {
        $user = $this->client();

        $this->actingAs($user)->post('/user/profile', ['name' => $user->name]);

        $this->assertSame('8554', $user->fresh()->tax_id);
    }

    public function test_an_avatar_preset_can_be_chosen(): void
    {
        $user = $this->client();

        $this->actingAs($user)->post('/user/profile', [
            'name'          => $user->name,
            'avatar_preset' => 'ocean',
        ]);

        $user = $user->fresh();

        $this->assertSame('preset:ocean', $user->avatar);
        $this->assertSame('ocean', $user->avatarPreset());
        $this->assertNull($user->avatarUrl());
    }

    public function test_an_unknown_avatar_preset_is_rejected(): void
    {
        $this->actingAs($user = $this->client())
            ->post('/user/profile', ['name' => $user->name, 'avatar_preset' => 'chartreuse'])
            ->assertSessionHasErrors('avatar_preset');
    }

    public function test_initials_come_from_the_first_two_names(): void
    {
        $this->assertSame('DM', $this->client()->initials());
    }

    public function test_notification_preference_is_saved(): void
    {
        $user = $this->client();

        $this->actingAs($user)
            ->put('/user/profile/settings', ['notifications_enabled' => false])
            ->assertSessionHas('success');

        $this->assertFalse($user->fresh()->notifications_enabled);
    }

    public function test_the_password_change_requires_the_current_password(): void
    {
        $this->actingAs($this->client())
            ->put('/user/profile/password', [
                'current_password'      => 'wrong-password',
                'password'              => 'a-much-longer-secret',
                'password_confirmation' => 'a-much-longer-secret',
            ])
            ->assertSessionHasErrors('current_password');
    }

    public function test_the_verification_checklist_tracks_what_is_outstanding(): void
    {
        $user = $this->client([
            'is_verified'          => false,
            'name_match_confirmed' => false,
            'id_document_type'     => null,
        ]);

        $verification = (new AccountSummary($user, app(MarketData::class)))->verification();

        $this->assertFalse($verification['is_verified']);
        // Personal details and the tax ID are on file; three steps are not.
        $this->assertSame(40, $verification['progress']);
        $this->assertSame('8554', $verification['tax_id_last4']);
    }

    public function test_a_fully_verified_account_reports_complete(): void
    {
        $user = $this->client([
            'id_document_type'     => "Driver's License",
            'name_match_confirmed' => true,
            'verified_at'          => now(),
        ]);

        $verification = (new AccountSummary($user, app(MarketData::class)))->verification();

        $this->assertSame(100, $verification['progress']);
        $this->assertTrue($verification['name_match']);
    }

    public function test_the_wallet_card_quotes_the_accrual_rate(): void
    {
        $wallet = (new AccountSummary($this->client(), app(MarketData::class)))->wallet();

        $this->assertSame(1.5, $wallet['daily_rate']);
        $this->assertSame(394751.27, $wallet['daily']);
        // 396.34 BTC of balance at 1.5% a day.
        $this->assertSame(5.94504925, $wallet['daily_base']);
        $this->assertSame(61.0, $wallet['deposited_base']);
    }

    public function test_pending_deposits_are_reported_separately_from_the_balance(): void
    {
        $user = $this->client();

        Deposit::create([
            'user_id'  => $user->id,
            'amount'   => 25000.00,
            'currency' => 'BTC',
            'status'   => 'pending',
        ]);

        $wallet = (new AccountSummary($user->fresh(), app(MarketData::class)))->wallet();

        $this->assertSame(25000.0, $wallet['pending']);
        $this->assertSame(4050400.0, $wallet['deposited']);
    }

    public function test_documents_are_stored_off_the_public_disk(): void
    {
        Storage::fake('local');

        $user = $this->client();

        $this->actingAs($user)
            ->from('/user/profile')
            ->post('/user/documents', [
                'type'  => 'proof_of_address',
                'label' => 'March utility bill',
                'file'  => UploadedFile::fake()->create('bill.pdf', 40, 'application/pdf'),
            ])
            ->assertRedirect('/user/profile')
            ->assertSessionHas('success');

        $document = UserDocument::firstOrFail();

        $this->assertSame('pending', $document->status);
        $this->assertSame('March utility bill', $document->label);
        Storage::disk('local')->assertExists($document->path);
    }

    public function test_an_unsupported_document_type_is_rejected(): void
    {
        $this->actingAs($this->client())
            ->post('/user/documents', [
                'type' => 'passport_scan',
                'file' => UploadedFile::fake()->create('scan.pdf', 10, 'application/pdf'),
            ])
            ->assertSessionHasErrors('type');
    }

    public function test_a_client_cannot_read_another_clients_document(): void
    {
        Storage::fake('local');

        $owner = $this->client();
        $other = User::create([
            'name'     => 'Someone Else',
            'username' => 'someone',
            'email'    => 'other@example.test',
            'password' => 'password',
            'role'     => 'user',
        ]);

        $this->actingAs($owner)->post('/user/documents', [
            'type' => 'tax_return',
            'file' => UploadedFile::fake()->create('return.pdf', 10, 'application/pdf'),
        ]);

        $document = UserDocument::firstOrFail();

        $this->actingAs($other)->get("/user/documents/{$document->id}")->assertForbidden();
        $this->actingAs($other)->delete("/user/documents/{$document->id}")->assertForbidden();
        $this->actingAs($owner)->get("/user/documents/{$document->id}")->assertOk();
    }

    public function test_a_reviewed_document_cannot_be_removed_by_the_client(): void
    {
        Storage::fake('local');

        $user = $this->client();

        $this->actingAs($user)->post('/user/documents', [
            'type' => 'bank_statement',
            'file' => UploadedFile::fake()->create('statement.pdf', 10, 'application/pdf'),
        ]);

        $document = UserDocument::firstOrFail();
        $document->update(['status' => 'approved']);

        $this->actingAs($user)
            ->from('/user/profile')
            ->delete("/user/documents/{$document->id}")
            ->assertSessionHasErrors('document');

        $this->assertDatabaseHas('user_documents', ['id' => $document->id]);
    }

    public function test_a_pending_document_can_be_removed_by_its_owner(): void
    {
        Storage::fake('local');

        $user = $this->client();

        $this->actingAs($user)->post('/user/documents', [
            'type' => 'utility_bill',
            'file' => UploadedFile::fake()->create('bill.pdf', 10, 'application/pdf'),
        ]);

        $document = UserDocument::firstOrFail();

        $this->actingAs($user)
            ->from('/user/profile')
            ->delete("/user/documents/{$document->id}")
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('user_documents', ['id' => $document->id]);
        Storage::disk('local')->assertMissing($document->path);
    }

    public function test_the_wallet_screen_lists_deposits_and_withdrawals_together(): void
    {
        $user = $this->client();

        $user->withdrawals()->create([
            'user_id'        => $user->id,
            'amount'         => 50000.00,
            'currency'       => 'BTC',
            'wallet_address' => 'bc1qexample',
            'status'         => 'pending',
        ]);

        $this->actingAs($user)->get('/user/wallet')->assertOk();

        $transactions = (new AccountSummary($user->fresh(), app(MarketData::class)))->transactions();

        $this->assertCount(2, $transactions);
        $this->assertSame(['deposit', 'withdrawal'], collect($transactions)->pluck('kind')->sort()->values()->all());
    }
}
