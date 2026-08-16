<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserDocument;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class IdentityVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    protected function admin(): User
    {
        return User::create([
            'name' => 'Admin', 'username' => 'admin', 'email' => 'admin@example.com',
            'password' => 'password', 'role' => 'admin',
        ])->fresh();
    }

    protected function client(): User
    {
        return User::create([
            'name' => 'Client', 'username' => 'client', 'email' => 'client@example.com',
            'password' => 'password', 'role' => 'user', 'balance' => 1000,
        ])->fresh();
    }

    protected function submit(User $client, string $type = 'drivers_license', bool $withBack = true)
    {
        $payload = ['type' => $type, 'front' => UploadedFile::fake()->image('front.jpg')];

        if ($withBack) {
            $payload['back'] = UploadedFile::fake()->image('back.jpg');
        }

        return $this->actingAs($client)->post('/user/identity', $payload);
    }

    public function test_a_client_submits_both_sides_of_a_photo_id(): void
    {
        $client = $this->client();

        $this->submit($client)->assertRedirect();

        $documents = UserDocument::where('user_id', $client->id)->get();

        $this->assertCount(2, $documents);
        $this->assertEqualsCanonicalizing(['front', 'back'], $documents->pluck('side')->all());
        $this->assertCount(1, $documents->pluck('submission_id')->unique());
        $this->assertSame('pending', $documents->first()->status);

        // The files land on the private disk, never the public one.
        foreach ($documents as $document) {
            Storage::disk('local')->assertExists($document->path);
            $this->assertStringStartsWith("documents/{$client->id}", $document->path);
        }

        // Uploading records the checklist step but does not verify the account.
        $this->assertSame("Driver's Licence", $client->fresh()->id_document_type);
        $this->assertFalse((bool) $client->fresh()->is_verified);
    }

    public function test_a_two_sided_document_requires_the_back(): void
    {
        $client = $this->client();

        $this->submit($client, 'state_id', withBack: false)
            ->assertSessionHasErrors('back');

        $this->assertSame(0, UserDocument::where('user_id', $client->id)->count());
    }

    public function test_a_passport_needs_only_its_photo_page(): void
    {
        $client = $this->client();

        $this->submit($client, 'passport', withBack: false)->assertRedirect();

        $this->assertSame(1, UserDocument::where('user_id', $client->id)->count());
    }

    public function test_an_unknown_document_type_is_rejected(): void
    {
        $this->submit($this->client(), 'library_card')->assertSessionHasErrors('type');
    }

    public function test_resubmitting_replaces_the_pending_set(): void
    {
        $client = $this->client();

        $this->submit($client);
        $firstPaths = UserDocument::where('user_id', $client->id)->pluck('path');

        $this->submit($client, 'passport', withBack: false);

        $this->assertSame(1, UserDocument::where('user_id', $client->id)->count());
        foreach ($firstPaths as $path) {
            Storage::disk('local')->assertMissing($path);
        }
    }

    public function test_approving_verifies_the_client_and_earns_the_badge(): void
    {
        $client = $this->client();
        $this->submit($client);

        $this->actingAs($this->admin())
            ->post("/admin/verifications/{$client->id}/approve", ['notes' => 'Matches on file'])
            ->assertRedirect()
            ->assertSessionHas('success');

        $client = $client->fresh();

        $this->assertTrue((bool) $client->is_verified);
        $this->assertNotNull($client->verified_at);
        $this->assertTrue((bool) $client->name_match_confirmed);
        $this->assertSame("Driver's Licence", $client->id_document_type);

        $this->assertSame(
            ['approved', 'approved'],
            UserDocument::where('user_id', $client->id)->pluck('status')->all(),
        );
    }

    public function test_approving_records_the_name_and_tax_id_the_reviewer_confirmed(): void
    {
        $client = $this->client();
        $client->forceFill(['tax_id' => '8554'])->save();
        $this->submit($client->fresh());

        $this->actingAs($this->admin())
            ->post("/admin/verifications/{$client->id}/approve", [
                'verified_name' => 'Clientina J. Client',
                'tax_id_match'  => true,
            ])
            ->assertRedirect();

        $client = $client->fresh();

        $this->assertSame('Clientina J. Client', $client->verified_name);
        $this->assertSame('Clientina J. Client', $client->verifiedName());
        $this->assertNotNull($client->tax_id_verified_at);
        $this->assertSame('verified', $client->accountStatus());
    }

    public function test_approving_falls_back_to_the_account_name_and_leaves_the_tax_id_unconfirmed(): void
    {
        $client = $this->client();
        $client->forceFill(['tax_id' => '8554'])->save();
        $this->submit($client->fresh());

        $this->actingAs($this->admin())
            ->post("/admin/verifications/{$client->id}/approve", ['verified_name' => '  '])
            ->assertRedirect();

        $client = $client->fresh();

        $this->assertSame('Client', $client->verified_name);
        $this->assertNull($client->tax_id_verified_at);
    }

    public function test_a_tax_id_cannot_be_confirmed_when_the_client_never_supplied_one(): void
    {
        $client = $this->client();
        $this->submit($client);

        $this->actingAs($this->admin())
            ->post("/admin/verifications/{$client->id}/approve", ['tax_id_match' => true])
            ->assertRedirect();

        $this->assertNull($client->fresh()->tax_id_verified_at);
    }

    public function test_the_verified_details_reach_the_client_dashboard_and_profile(): void
    {
        $client = $this->client();
        $client->forceFill(['tax_id' => '8554'])->save();
        $this->submit($client->fresh());

        $this->actingAs($this->admin())
            ->post("/admin/verifications/{$client->id}/approve", [
                'verified_name' => 'Clientina J. Client',
                'tax_id_match'  => true,
            ]);

        $expect = fn ($page) => $page
            ->where('verification.is_verified', true)
            ->where('verification.name_match', true)
            ->where('verification.verified_name', 'Clientina J. Client')
            ->where('verification.tax_id_last4', '8554')
            ->where('verification.tax_id_verified', true)
            ->where('verification.document_type', "Driver's Licence");

        $this->actingAs($client->fresh())->get('/user/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $expect($page->component('Dashboard/Index')));

        $this->actingAs($client->fresh())->get('/user/profile')
            ->assertOk()
            ->assertInertia(fn ($page) => $expect($page->component('Dashboard/Profile')));
    }

    public function test_submitting_an_id_moves_the_account_into_pending_review(): void
    {
        $client = $this->client();

        $this->assertSame('active', $client->accountStatus());

        $this->submit($client);

        $this->assertSame('pending', $client->fresh()->accountStatus());
    }

    public function test_an_admin_verifies_a_client_from_the_account_settings_form(): void
    {
        $client = $this->client();
        $client->forceFill(['tax_id' => '8554'])->save();

        $this->actingAs($this->admin())
            ->put("/admin/users/{$client->id}/settings", [
                'status'        => 'verified',
                'verified_name' => 'Clientina J. Client',
                'tax_id_match'  => true,
                'topup_enabled' => true,
                'daily_topup_percent' => null,
            ])
            ->assertRedirect();

        $client = $client->fresh();

        $this->assertTrue((bool) $client->is_verified);
        $this->assertSame('Clientina J. Client', $client->verified_name);
        $this->assertNotNull($client->verified_at);
        $this->assertNotNull($client->tax_id_verified_at);
        $this->assertSame('verified', $client->accountStatus());
    }

    public function test_putting_a_client_back_in_review_withdraws_the_verified_details(): void
    {
        $client = $this->client();
        $client->markVerified('Clientina J. Client');

        $this->actingAs($this->admin())
            ->put("/admin/users/{$client->id}/settings", [
                'status' => 'pending', 'topup_enabled' => true, 'daily_topup_percent' => null,
            ])
            ->assertRedirect();

        $client = $client->fresh();

        $this->assertFalse((bool) $client->is_verified);
        $this->assertNull($client->verified_name);
        $this->assertNull($client->verified_at);
        $this->assertFalse((bool) $client->name_match_confirmed);
        $this->assertSame('pending', $client->accountStatus());
    }

    public function test_a_suspended_client_keeps_the_verification_already_on_file(): void
    {
        $client = $this->client();
        $client->markVerified('Clientina J. Client');

        $this->actingAs($this->admin())
            ->put("/admin/users/{$client->id}/settings", [
                'status' => 'suspended', 'topup_enabled' => true, 'daily_topup_percent' => null,
            ])
            ->assertRedirect();

        $client = $client->fresh();

        $this->assertTrue((bool) $client->is_verified);
        $this->assertSame('Clientina J. Client', $client->verified_name);
        // Standing wins in the picker, so it cannot read "verified" here.
        $this->assertSame('suspended', $client->accountStatus());
    }

    public function test_rejecting_records_a_reason_and_leaves_the_client_unverified(): void
    {
        $client = $this->client();
        $this->submit($client);

        $this->actingAs($this->admin())
            ->post("/admin/verifications/{$client->id}/reject", ['notes' => 'Back of card is unreadable'])
            ->assertRedirect();

        $this->assertFalse((bool) $client->fresh()->is_verified);
        $this->assertSame(
            'Back of card is unreadable',
            UserDocument::where('user_id', $client->id)->first()->admin_notes,
        );
    }

    public function test_a_rejection_must_carry_a_reason(): void
    {
        $client = $this->client();
        $this->submit($client);

        $this->actingAs($this->admin())
            ->post("/admin/verifications/{$client->id}/reject", [])
            ->assertSessionHasErrors('notes');
    }

    public function test_approving_a_client_with_nothing_pending_is_refused(): void
    {
        $this->actingAs($this->admin())
            ->post("/admin/verifications/{$this->client()->id}/approve")
            ->assertSessionHasErrors('error');
    }

    public function test_an_already_verified_client_cannot_resubmit(): void
    {
        $client = $this->client();
        $client->forceFill(['is_verified' => true])->save();

        $this->submit($client->fresh())->assertSessionHasErrors('front');
    }

    public function test_clients_cannot_reach_the_verification_queue_or_the_documents(): void
    {
        $client = $this->client();
        $this->submit($client);
        $document = UserDocument::where('user_id', $client->id)->firstOrFail();

        $this->actingAs($client)->get('/admin/verifications')->assertForbidden();
        $this->actingAs($client)->get("/admin/verifications/document/{$document->id}")->assertForbidden();
    }

    public function test_an_admin_can_stream_a_submitted_document(): void
    {
        $client = $this->client();
        $this->submit($client);
        $document = UserDocument::where('user_id', $client->id)->firstOrFail();

        $this->actingAs($this->admin())
            ->get("/admin/verifications/document/{$document->id}")
            ->assertOk();
    }

    public function test_the_queue_groups_a_submission_into_one_card(): void
    {
        $client = $this->client();
        $this->submit($client);

        $this->actingAs($this->admin())
            ->get('/admin/verifications')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Verifications')
                ->has('submissions', 1)
                ->has('submissions.0.files', 2)
                ->where('counts.pending', 1));
    }

    public function test_photo_id_stays_out_of_the_supporting_documents_list(): void
    {
        $client = $this->client();
        $this->submit($client);

        $documents = (new \App\Services\AccountSummary($client->fresh(), app(\App\Services\MarketData::class)))->documents();

        $this->assertSame([], $documents);
    }
}
