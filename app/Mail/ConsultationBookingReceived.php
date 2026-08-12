<?php

namespace App\Mail;

use App\Models\ConsultationBooking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ConsultationBookingReceived extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ConsultationBooking $booking,
        public array $advisor,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: sprintf(
                'Consultation booking — %s with %s, %s at %s',
                $this->booking->full_name,
                $this->booking->advisor_name,
                $this->booking->scheduled_date->format('D j M Y'),
                $this->booking->scheduled_time,
            ),
            // Replying to the notification reaches the client directly.
            replyTo: [
                new Address($this->booking->email, $this->booking->full_name),
            ],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.consultation-booking-received',
        );
    }
}
