<?php

namespace App\Http\Controllers;

use App\Mail\ConsultationBookingReceived;
use App\Models\ConsultationBooking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ConsultationBookingController extends Controller
{
    public function show(): Response
    {
        $window = (int) config('advisors.booking_window_days');

        return Inertia::render('Schedule', [
            'advisors' => collect(config('advisors.roster'))
                ->map(fn (array $advisor, string $id) => ['id' => $id] + $advisor)
                ->values(),
            'slots' => config('advisors.slots'),
            'timezoneLabel' => config('advisors.timezone_label'),
            'sessionMinutes' => (int) config('advisors.session_minutes'),
            'bookingWindowDays' => $window,
            // Taken slots so the client cannot pick one that is already gone.
            // Re-checked on store, since this snapshot goes stale the moment
            // somebody else books.
            'takenSlots' => ConsultationBooking::query()
                ->whereBetween('scheduled_date', [today(), today()->addDays($window)])
                ->get(['advisor_id', 'scheduled_date', 'scheduled_time'])
                ->map(fn (ConsultationBooking $booking) => [
                    'advisorId' => $booking->advisor_id,
                    'date' => $booking->scheduled_date->toDateString(),
                    'time' => $booking->scheduled_time,
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $window = (int) config('advisors.booking_window_days');

        $validated = $request->validate([
            'advisor_id' => ['required', Rule::in(array_keys(config('advisors.roster')))],
            'scheduled_date' => [
                'required',
                'date_format:Y-m-d',
                'after_or_equal:today',
                'before_or_equal:'.today()->addDays($window)->toDateString(),
            ],
            'scheduled_time' => ['required', Rule::in(config('advisors.slots'))],
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:40'],
            'topic' => ['nullable', 'string', 'max:2000'],
        ]);

        $date = Carbon::createFromFormat('Y-m-d', $validated['scheduled_date']);

        if ($date->isWeekend()) {
            return back()
                ->withErrors(['scheduled_date' => 'The desk takes consultations on weekdays only.'])
                ->withInput();
        }

        $advisor = config('advisors.roster')[$validated['advisor_id']];

        // Guard the slot here too — the page's availability snapshot is stale as
        // soon as another client books the same time.
        $alreadyTaken = ConsultationBooking::query()
            ->where('advisor_id', $validated['advisor_id'])
            ->whereDate('scheduled_date', $date)
            ->where('scheduled_time', $validated['scheduled_time'])
            ->exists();

        if ($alreadyTaken) {
            return back()
                ->withErrors(['scheduled_time' => 'That slot was just taken. Please choose another time.'])
                ->withInput();
        }

        $booking = ConsultationBooking::create([
            'advisor_id' => $validated['advisor_id'],
            'advisor_name' => $advisor['name'],
            'scheduled_date' => $date,
            'scheduled_time' => $validated['scheduled_time'],
            'timezone' => config('advisors.timezone'),
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'topic' => $validated['topic'] ?? null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        Mail::to(config('advisors.notification_email'))
            ->send(new ConsultationBookingReceived($booking, $advisor));

        return back()->with(
            'success',
            'Consultation requested. The desk will confirm your booking by email shortly.',
        );
    }
}
