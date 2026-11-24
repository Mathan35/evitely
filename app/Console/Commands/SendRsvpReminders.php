<?php

namespace App\Console\Commands;

use App\Models\Wedding;
use App\Services\RsvpReminderService;
use Illuminate\Console\Command;

class SendRsvpReminders extends Command
{
    protected $signature = 'rsvp:remind {--wedding= : Limit to a single event id} {--force : Ignore the host preference toggle and cooldown}';

    protected $description = 'Email RSVP reminders to pending guests with an email on file';

    public function handle(RsvpReminderService $reminders): int
    {
        $weddingId = $this->option('wedding');
        $force = (bool) $this->option('force');

        $query = Wedding::query()->with(['setting', 'guests']);

        if ($weddingId !== null && $weddingId !== '') {
            $query->whereKey((int) $weddingId);
        }

        $sent = 0;
        $skippedEvents = 0;
        $skipped = 0;
        $failed = 0;
        $cooldown = 0;

        $query->chunkById(50, function ($weddings) use ($force, $reminders, &$sent, &$skippedEvents, &$skipped, &$failed, &$cooldown): void {
            foreach ($weddings as $wedding) {
                if (! $force && ! $reminders->remindersEnabled($wedding)) {
                    $skippedEvents++;

                    continue;
                }

                $result = $reminders->sendForWedding($wedding, $force);
                $sent += $result['sent'];
                $skipped += $result['skipped'];
                $failed += $result['failed'];
                $cooldown += $result['cooldown'];
            }
        });

        $this->info("RSVP reminders sent={$sent} skipped_events={$skippedEvents} skipped_no_email={$skipped} cooldown={$cooldown} failed={$failed}");

        return self::SUCCESS;
    }
}
