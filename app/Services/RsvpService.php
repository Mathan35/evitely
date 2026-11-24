<?php

namespace App\Services;

use App\Enums\InvitationDeliveryStatus;
use App\Enums\RsvpStatus;
use App\Models\EventRsvp;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use App\Models\WeddingRsvp;
use App\Notifications\RsvpReceived;
use App\Notifications\RsvpThankYou;
use Carbon\Carbon;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

class RsvpService
{
    public function __construct(private WeddingAnalyticsService $analytics) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function store(Wedding $wedding, array $data, ?WeddingGuest $guest = null): WeddingRsvp
    {
        $this->assertRsvpOpen($wedding);

        $email = strtolower(trim((string) $data['email']));

        $answers = is_array($data['answers'] ?? null) ? $data['answers'] : [];

        foreach (['company', 'job_title'] as $key) {
            if (filled($data[$key] ?? null)) {
                $answers[$key] = $data[$key];
            }
        }

        $rsvp = WeddingRsvp::query()->updateOrCreate(
            [
                'event_id' => $wedding->id,
                'email' => $email,
            ],
            [
                'event_guest_id' => $guest?->id,
                'guest_name' => $data['guest_name'],
                'status' => $data['status'],
                'guest_count' => $data['status'] === RsvpStatus::Attending->value ? (int) $data['guest_count'] : 0,
                'meal_preference' => $data['meal_preference'] ?? null,
                'dietary_restrictions' => $data['dietary_restrictions'] ?? null,
                'message' => $data['message'] ?? null,
                'answers' => $answers === [] ? null : $answers,
            ],
        );

        $rsvp->eventReplies()->delete();

        $allowed = $wedding->events()->pluck('id')->all();

        foreach ($data['events'] ?? [] as $eventId => $attending) {
            $eventId = (int) $eventId;

            if (! in_array($eventId, $allowed, true)) {
                throw ValidationException::withMessages([
                    'events' => 'One of the selected events does not belong to this wedding.',
                ]);
            }

            EventRsvp::query()->create([
                'event_rsvp_id' => $rsvp->id,
                'event_schedule_id' => $eventId,
                'attending' => filter_var($attending, FILTER_VALIDATE_BOOLEAN),
            ]);
        }

        if ($guest) {
            $guest->rsvp_status = RsvpStatus::from($data['status']);
            $guest->invitation_status = InvitationDeliveryStatus::Responded;
            $guest->save();
        }

        $wedding->user->notify(new RsvpReceived($rsvp));

        $wedding->loadMissing('setting');
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $thankYouOn = in_array(
            strtolower(trim((string) ($details['rsvp_thank_you_enabled'] ?? ''))),
            ['1', 'true', 'yes', 'on'],
            true,
        );
        if ($thankYouOn && $email !== '') {
            $rsvp->setRelation('wedding', $wedding);
            Notification::route('mail', $email)->notify(new RsvpThankYou($rsvp));
        }

        $this->analytics->record($wedding, 'rsvp', $guest);

        return $rsvp;
    }

    public function assertRsvpOpen(Wedding $wedding): void
    {
        $wedding->loadMissing('setting');
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $deadline = trim((string) ($details['rsvp_deadline'] ?? ''));
        if ($deadline === '') {
            return;
        }

        try {
            $ends = Carbon::parse($deadline, $wedding->timezone ?: config('app.timezone'))->endOfDay();
        } catch (\Throwable) {
            return;
        }

        if (now($wedding->timezone ?: config('app.timezone'))->lte($ends)) {
            return;
        }

        throw ValidationException::withMessages([
            'status' => 'RSVPs closed on '.$ends->toFormattedDateString().'. Please contact the hosts if you need to change your reply.',
        ]);
    }

    /**
     * @return array{deadline: ?string, closed: bool, soft_close: bool}
     */
    public function deadlineState(Wedding $wedding): array
    {
        $wedding->loadMissing('setting');
        $details = is_array($wedding->setting?->details) ? $wedding->setting->details : [];
        $deadline = trim((string) ($details['rsvp_deadline'] ?? ''));
        $soft = in_array(
            strtolower(trim((string) ($details['rsvp_soft_close'] ?? '1'))),
            ['1', 'true', 'yes', 'on', ''],
            true,
        );

        if ($deadline === '') {
            return ['deadline' => null, 'closed' => false, 'soft_close' => $soft];
        }

        try {
            $ends = Carbon::parse($deadline, $wedding->timezone ?: config('app.timezone'))->endOfDay();
        } catch (\Throwable) {
            return ['deadline' => $deadline, 'closed' => false, 'soft_close' => $soft];
        }

        $closed = now($wedding->timezone ?: config('app.timezone'))->gt($ends);

        return [
            'deadline' => $deadline,
            'closed' => $closed,
            'soft_close' => $soft,
        ];
    }
}
