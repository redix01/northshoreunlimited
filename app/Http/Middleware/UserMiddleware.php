<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class UserMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Admins keep working through maintenance windows.
        if ($user?->isAdmin()) {
            return $next($request);
        }

        if ($user?->isSuspended()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'username' => 'This account has been suspended. Please contact support.',
            ]);
        }

        if (Setting::get('maintenance_mode')) {
            return Inertia::render('Maintenance', [
                'message' => Setting::get('maintenance_message'),
                'support' => Setting::get('support_email'),
            ])->toResponse($request)->setStatusCode(503);
        }

        return $next($request);
    }
}
