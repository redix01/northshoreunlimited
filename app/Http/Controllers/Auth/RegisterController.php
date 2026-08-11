<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class RegisterController extends Controller
{
    public function show()
    {
        abort_unless(config('registration.enabled'), 404);

        return Inertia::render('Auth/Register', [
            'countries'    => config('locations.countries'),
            'subdivisions' => config('locations.subdivisions'),
            'promotion'    => config('registration.promotion'),
            'hero'         => config('registration.hero'),
            'minimumAge'   => config('registration.minimum_age'),
        ]);
    }

    public function store(Request $request)
    {
        abort_unless(config('registration.enabled'), 404);

        $countries = array_keys(config('locations.countries'));
        $minimumAge = config('registration.minimum_age');

        $validated = $request->validate([
            'email'       => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'    => ['required', 'confirmed', Password::min(8)],

            'first_name'  => ['required', 'string', 'min:2', 'max:100'],
            'last_name'   => ['required', 'string', 'min:2', 'max:100'],
            'date_of_birth' => ['required', 'date', 'before:'.now()->subYears($minimumAge)->toDateString()],
            'phone'       => ['required', 'string', 'min:6', 'max:30'],

            'country'     => ['required', Rule::in($countries)],
            'street'      => ['required', 'string', 'max:255'],
            'city'        => ['required', 'string', 'max:120'],
            'state'       => ['required', 'string', 'max:120'],
            'postal_code' => ['required', 'string', 'max:32'],

            'referral_code' => ['nullable', 'string', 'max:32'],
            'terms'         => ['accepted'],
        ], [
            'date_of_birth.before' => "You must be at least {$minimumAge} years old to open an account.",
            'terms.accepted'       => 'Please accept the Terms of Service and Privacy Policy.',
        ]);

        $countryName = config('locations.countries')[$validated['country']];
        $stateName   = $this->subdivisionName($validated['country'], $validated['state']);

        $user = new User([
            'name'          => trim($validated['first_name'].' '.$validated['last_name']),
            'username'      => $this->uniqueUsername($validated['email']),
            'email'         => $validated['email'],
            'password'      => $validated['password'],
            'role'          => 'user',
            'phone'         => $validated['phone'],
            'date_of_birth' => $validated['date_of_birth'],
            'address_line1' => $validated['street'],
            'city'          => $validated['city'],
            'state'         => $stateName,
            'postal_code'   => $validated['postal_code'],
            'country'       => $countryName,
            'member_id'     => $this->uniqueMemberId(),
            'referred_by'   => $this->resolveReferrer($validated['referral_code'] ?? null)?->id,
        ]);

        // Kept in step with the structured parts for the admin screens.
        $user->address = $user->formattedAddress();
        $user->terms_accepted_at = now();
        $user->save();

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('dashboard')
            ->with('success', 'Welcome to '.config('app.name').'. Complete verification to enable deposits and withdrawals.');
    }

    /**
     * A referral code is another client's member ID. An unknown code is
     * ignored rather than rejected — it must never block a sign-up.
     */
    private function resolveReferrer(?string $code): ?User
    {
        if (! $code) {
            return null;
        }

        return User::where('member_id', strtoupper(trim($code)))
            ->where('role', 'user')
            ->first();
    }

    private function subdivisionName(string $country, string $state): string
    {
        return config("locations.subdivisions.{$country}.{$state}", $state);
    }

    /** Derived from the email so the client has something memorable to sign in with. */
    private function uniqueUsername(string $email): string
    {
        $base = Str::slug(Str::before($email, '@'), '') ?: 'client';
        $base = Str::limit($base, 20, '');

        $username = $base;
        $suffix   = 1;

        while (User::where('username', $username)->exists()) {
            $username = $base.(++$suffix);
        }

        return $username;
    }

    private function uniqueMemberId(): string
    {
        $prefix = config('registration.member_id_prefix', 'GCC');

        do {
            $memberId = $prefix.'-'.strtoupper(Str::random(8));
        } while (User::where('member_id', $memberId)->exists());

        return $memberId;
    }
}
