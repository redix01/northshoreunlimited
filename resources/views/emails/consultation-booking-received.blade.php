<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
    <h2 style="margin: 0 0 16px;">New Consultation Booking</h2>

    <p style="margin: 0 0 12px;">
        A consultation was requested from the scheduling page. It is not confirmed
        until the desk replies to the client.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
        <tr>
            <td style="padding: 6px 12px 6px 0; font-weight: bold;">Advisor:</td>
            <td style="padding: 6px 0;">
                {{ $booking->advisor_name }} — {{ $advisor['role'] }}
            </td>
        </tr>
        <tr>
            <td style="padding: 6px 12px 6px 0; font-weight: bold;">Focus:</td>
            <td style="padding: 6px 0;">{{ $advisor['specialty'] }}</td>
        </tr>
        <tr>
            <td style="padding: 6px 12px 6px 0; font-weight: bold;">Date:</td>
            <td style="padding: 6px 0;">{{ $booking->scheduled_date->format('l, F j, Y') }}</td>
        </tr>
        <tr>
            <td style="padding: 6px 12px 6px 0; font-weight: bold;">Time:</td>
            <td style="padding: 6px 0;">
                {{ $booking->scheduled_time }} {{ config('advisors.timezone_label') }}
                ({{ config('advisors.session_minutes') }} min)
            </td>
        </tr>
        <tr>
            <td style="padding: 6px 12px 6px 0; font-weight: bold;">Full name:</td>
            <td style="padding: 6px 0;">{{ $booking->full_name }}</td>
        </tr>
        <tr>
            <td style="padding: 6px 12px 6px 0; font-weight: bold;">Email:</td>
            <td style="padding: 6px 0;">{{ $booking->email }}</td>
        </tr>
        <tr>
            <td style="padding: 6px 12px 6px 0; font-weight: bold;">Phone:</td>
            <td style="padding: 6px 0;">{{ $booking->phone }}</td>
        </tr>
        <tr>
            <td style="padding: 6px 12px 6px 0; font-weight: bold; vertical-align: top;">Topic:</td>
            <td style="padding: 6px 0;">{{ $booking->topic ?: 'Not provided' }}</td>
        </tr>
    </table>

    <p style="margin: 20px 0 0; color: #555; font-size: 13px;">
        Reference #{{ $booking->id }} · submitted {{ $booking->created_at->format('j M Y, H:i') }} UTC
    </p>
</div>
