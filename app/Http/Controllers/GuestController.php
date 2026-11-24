<?php

namespace App\Http\Controllers;

use App\Http\Requests\Weddings\BulkGuestRequest;
use App\Http\Requests\Weddings\StoreGuestRequest;
use App\Http\Requests\Weddings\UpdateGuestRequest;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use App\Services\Billing\BillingService;
use App\Services\GuestInvitationService;
use App\Services\TwilioMessagingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class GuestController extends Controller
{
    public function store(
        StoreGuestRequest $request,
        Wedding $wedding,
        GuestInvitationService $guests,
        BillingService $billing,
    ): RedirectResponse {
        $billing->assertCanAddGuests($request->user(), $wedding, 1);
        $data = $request->validated();
        $this->assertGroup($wedding, $data['guest_group_id'] ?? null);
        $guests->create($wedding, $data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Guest added.']);

        return back();
    }

    public function update(UpdateGuestRequest $request, Wedding $wedding, WeddingGuest $guest, GuestInvitationService $guests): RedirectResponse
    {
        abort_unless($guest->event_id === $wedding->id, 404);
        Gate::authorize('update', $guest);
        $data = $request->validated();
        $this->assertGroup($wedding, $data['guest_group_id'] ?? $guest->guest_group_id);
        $guests->update($guest, $data);

        return back();
    }

    public function destroy(Wedding $wedding, WeddingGuest $guest): RedirectResponse
    {
        abort_unless($guest->event_id === $wedding->id, 404);
        Gate::authorize('delete', $guest);
        $guest->delete();

        return back();
    }

    public function bulk(
        BulkGuestRequest $request,
        Wedding $wedding,
        GuestInvitationService $guests,
        TwilioMessagingService $twilio,
        BillingService $billing,
    ): RedirectResponse {
        $ids = $wedding->guests()->whereIn('id', $request->validated('guest_ids'))->pluck('id');
        $action = $request->validated('action');
        $user = $request->user();

        if ($action === 'delete') {
            $wedding->guests()->whereIn('id', $ids)->delete();
        }

        if ($action === 'assign_group') {
            $wedding->guests()->whereIn('id', $ids)->update([
                'guest_group_id' => $request->validated('guest_group_id'),
            ]);
        }

        if ($action === 'mark_shared') {
            $channel = $request->validated('channel') ?: 'whatsapp';
            $wedding->guests()->whereIn('id', $ids)->get()->each(
                fn (WeddingGuest $guest) => $guests->markShared($guest, $channel),
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => 'Share recorded.']);

            return back();
        }

        if ($action === 'mark_sent') {
            return $this->flashQueueResult(
                $this->queueEach($wedding, $ids, fn (WeddingGuest $guest) => $guests->markSent($guest)),
                'Invite emails',
                'no email',
            );
        }

        if ($action === 'send_sms' || $action === 'send_whatsapp') {
            $billing->assertCanUseAutomated($user, $wedding);
            $billing->assertHasCredits($user, max(1, $ids->count()));

            $channel = $action === 'send_sms' ? 'sms' : 'whatsapp';
            $result = $this->queueEach(
                $wedding,
                $ids,
                function (WeddingGuest $guest) use ($guests, $twilio, $billing, $channel, $user): array {
                    if (! $billing->consumeCredits($user, 1)) {
                        return [
                            'ok' => false,
                            'skipped' => true,
                            'message' => 'Out of credits',
                        ];
                    }

                    $queued = $guests->queueTwilio($guest, $channel, $twilio);
                    if (! $queued['ok']) {
                        $billing->grantCredits($user, 1);
                    }

                    return $queued;
                },
            );

            return $this->flashQueueResult(
                $result,
                $channel === 'sms' ? 'SMS' : 'WhatsApp',
                'no mobile, unavailable, or out of credits',
            );
        }

        if ($action === 'retry_failed') {
            return $this->flashQueueResult(
                $this->queueEach(
                    $wedding,
                    $ids,
                    function (WeddingGuest $guest) use ($guests, $twilio, $billing, $user): array {
                        $needsTwilio = filled($guest->whatsapp_last_error)
                            || filled($guest->sms_last_error)
                            || (
                                filled($guest->invitation_last_error)
                                && in_array($guest->invitation_last_channel, ['whatsapp', 'sms'], true)
                            );

                        if ($needsTwilio) {
                            if (! $billing->canUseAutomatedMessaging($user)) {
                                return [
                                    'ok' => false,
                                    'skipped' => true,
                                    'message' => 'Pro required for Twilio retry',
                                ];
                            }
                            if (! $billing->consumeCredits($user, 1)) {
                                return [
                                    'ok' => false,
                                    'skipped' => true,
                                    'message' => 'Out of credits',
                                ];
                            }
                        }

                        $result = $guests->retryFailed($guest, $twilio);
                        if ($needsTwilio && ! $result['ok']) {
                            $billing->grantCredits($user, 1);
                        }

                        return $result;
                    },
                ),
                'Retry',
                'nothing to retry',
            );
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Guests updated.']);

        return back();
    }

    /**
     * @param  \Illuminate\Support\Collection<int, int>  $ids
     * @param  callable(WeddingGuest): array{ok: bool, skipped: bool, message: string}  $callback
     * @return array{sent: int, skipped: int, failed: int}
     */
    private function queueEach(Wedding $wedding, $ids, callable $callback): array
    {
        $sent = 0;
        $skipped = 0;
        $failed = 0;

        $wedding->guests()->whereIn('id', $ids)->get()->each(function (WeddingGuest $guest) use ($callback, &$sent, &$skipped, &$failed): void {
            $result = $callback($guest);
            if ($result['ok']) {
                $sent++;
            } elseif ($result['skipped']) {
                $skipped++;
            } else {
                $failed++;
            }
        });

        return compact('sent', 'skipped', 'failed');
    }

    /**
     * @param  array{sent: int, skipped: int, failed: int}  $counts
     */
    private function flashQueueResult(array $counts, string $label, string $skipReason): RedirectResponse
    {
        $parts = [];
        if ($counts['sent'] > 0) {
            $parts[] = "{$counts['sent']} queued";
        }
        if ($counts['skipped'] > 0) {
            $parts[] = "{$counts['skipped']} skipped ({$skipReason})";
        }
        if ($counts['failed'] > 0) {
            $parts[] = "{$counts['failed']} failed";
        }

        Inertia::flash('toast', [
            'type' => $counts['failed'] > 0 ? 'error' : 'success',
            'message' => $parts !== [] ? "{$label}: ".implode(', ', $parts).'.' : 'No guests updated.',
        ]);

        return back();
    }

    private function assertGroup(Wedding $wedding, mixed $groupId): void
    {
        if ($groupId === null || $groupId === '') {
            return;
        }

        abort_unless($wedding->groups()->whereKey($groupId)->exists(), 422);
    }
}
