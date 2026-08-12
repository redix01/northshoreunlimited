<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Define the props that are shared by default.
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return array_merge(parent::share($request), [
            // Lets the marketing header hide Sign Up when /register would 404.
            'registrationOpen' => (bool) config('registration.enabled'),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
            ],
            'auth' => [
                'user' => $user ? [
                    'id'          => $user->id,
                    'name'        => $user->name,
                    'username'    => $user->username,
                    'email'       => $user->email,
                    'role'        => $user->role,
                    'balance'     => (float) $user->balance,
                    'is_verified' => $user->is_verified,
                    'member_id'   => $user->member_id,
                    'avatar'      => $user->avatar,
                    'phone'       => $user->phone,
                    'address'     => $user->address,
                    'created_at'  => $user->created_at?->format('F Y'),
                ] : null,
            ],
        ]);
    }
}
