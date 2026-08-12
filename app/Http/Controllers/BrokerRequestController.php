<?php

namespace App\Http\Controllers;

use App\Mail\TradeRequestReceived;
use App\Models\TradeRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * "P2P Broker" deposits from the dashboard. The client asks to be matched with
 * a broker rather than sending to a wallet themselves; the desk follows up.
 */
class BrokerRequestController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => ['nullable', 'numeric', 'min:0', 'max:9999999'],
            'note'   => ['nullable', 'string', 'max:2000'],
        ]);

        $user   = Auth::user();
        $volume = $validated['amount'] ?? null;

        $payload = [
            'full_name'            => $user->name,
            'email'                => $user->email,
            'jurisdiction'         => Str::limit((string) $user->address, 250, '') ?: null,
            'estimated_btc_volume' => $volume !== null ? number_format((float) $volume, 2, '.', '') : 'Not specified',
            'transaction_context'  => trim(sprintf(
                "P2P broker deposit request from the client dashboard.\nMember ID: %s\n%s",
                $user->member_id ?? 'n/a',
                $validated['note'] ?? '',
            )),
        ];

        TradeRequest::create($payload + [
            'consent'    => true,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        try {
            Mail::to(config('mail.desk_address', 'trade@northshoreunlimited.com'))
                ->send(new TradeRequestReceived($payload));
        } catch (\Throwable $e) {
            // The request is already recorded; a mail outage must not lose it.
            Log::warning('Broker request mail failed: '.$e->getMessage());
        }

        return back()->with('success', 'Broker request submitted. Our desk will reach out within 24 hours.');
    }
}
