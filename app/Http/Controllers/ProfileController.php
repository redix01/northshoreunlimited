<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserDocument;
use App\Models\Wallet;
use App\Services\AccountSummary;
use App\Services\MarketData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function show(MarketData $market)
    {
        $user    = Auth::user();
        $account = new AccountSummary($user, $market);

        return Inertia::render('Dashboard/Profile', [
            'profileUser'    => $this->present($user),
            'verification'   => $account->verification(),
            'documents'      => $account->documents(),
            'wallet'         => $account->wallet(),
            'transactions'   => $account->transactions(6),
            'documentTypes'  => UserDocument::TYPES,
            'avatarPresets'  => User::AVATAR_PRESETS,
            // The balance card on this screen opens the same deposit/withdraw
            // dialogs as the dashboard, so it needs the wallet list too.
            'wallets'        => Wallet::where('is_active', true)
                ->orderByRaw('CASE WHEN currency = ? THEN 0 ELSE 1 END', [config('markets.base', 'BTC')])
                ->orderBy('currency')
                ->orderBy('network')
                ->get(),
        ]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name'              => ['required', 'string', 'max:255'],
            'phone'             => ['nullable', 'string', 'max:30'],
            'address_line1'     => ['nullable', 'string', 'max:255'],
            'city'              => ['nullable', 'string', 'max:120'],
            'state'             => ['nullable', 'string', 'max:120'],
            'postal_code'       => ['nullable', 'string', 'max:32'],
            'country'           => ['nullable', 'string', 'max:120'],
            'date_of_birth'     => ['nullable', 'date', 'before:today'],
            'employment_status' => ['nullable', 'string', 'max:100'],
            'occupation'        => ['nullable', 'string', 'max:100'],
            'source_of_funds'   => ['nullable', 'string', 'max:100'],
            'pep_status'        => ['boolean'],
            // Only the last four are ever collected or stored.
            'tax_id'            => ['nullable', 'digits:4'],
            'avatar_preset'     => ['nullable', Rule::in(array_keys(User::AVATAR_PRESETS))],
            'avatar'            => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $user->fill(collect($validated)->except(['avatar', 'avatar_preset', 'tax_id'])->all());

        if (array_key_exists('tax_id', $validated) && $validated['tax_id'] !== null) {
            $user->tax_id = $validated['tax_id'];
        }

        // Keep the legacy free-text column in step for the admin screens.
        $user->address = $user->formattedAddress();

        if ($request->hasFile('avatar') && $request->file('avatar')->isValid()) {
            $this->forgetUploadedAvatar($user);
            $user->avatar = $request->file('avatar')->store('avatars', 'public');
        } elseif (! empty($validated['avatar_preset'])) {
            $this->forgetUploadedAvatar($user);
            $user->avatar = User::AVATAR_PRESET_PREFIX.$validated['avatar_preset'];
        }

        $user->save();

        return back()->with('success', 'Profile updated successfully.');
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'notifications_enabled' => ['required', 'boolean'],
        ]);

        Auth::user()->update($validated);

        return back()->with('success', 'Notification preference saved.');
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password'         => ['required', 'min:8', 'confirmed'],
        ]);

        Auth::user()->update(['password' => $request->input('password')]);

        return back()->with('success', 'Password updated successfully.');
    }

    /** Shape the signed-in user for the profile screen. */
    private function present(User $user): array
    {
        return [
            'name'              => $user->name,
            'email'             => $user->email,
            'email_verified'    => (bool) $user->email_verified_at,
            'phone'             => $user->phone,
            'date_of_birth'     => optional($user->date_of_birth)->toDateString(),
            'address_line1'     => $user->address_line1,
            'city'              => $user->city,
            'state'             => $user->state,
            'postal_code'       => $user->postal_code,
            'country'           => $user->country,
            'address'           => $user->formattedAddress(),
            'employment_status' => $user->employment_status,
            'occupation'        => $user->occupation,
            'source_of_funds'   => $user->source_of_funds,
            'pep_status'        => (bool) $user->pep_status,
            'tax_id_last4'      => $user->tax_id ? substr(preg_replace('/\D/', '', $user->tax_id), -4) : null,
            'member_id'         => $user->member_id,
            'is_verified'       => (bool) $user->is_verified,
            'is_vip'            => (bool) $user->is_vip,
            'notifications_enabled' => (bool) $user->notifications_enabled,
            'avatar_url'        => $user->avatarUrl(),
            'avatar_preset'     => $user->avatarPreset(),
            'initials'          => $user->initials(),
            'created_at'        => optional($user->created_at)->toIso8601String(),
            'updated_at'        => optional($user->updated_at)->toIso8601String(),
        ];
    }

    private function forgetUploadedAvatar(User $user): void
    {
        if ($user->avatar && ! str_starts_with($user->avatar, User::AVATAR_PRESET_PREFIX)) {
            Storage::disk('public')->delete($user->avatar);
        }
    }
}
