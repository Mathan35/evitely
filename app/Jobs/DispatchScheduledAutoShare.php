<?php

namespace App\Jobs;

use App\Models\ScheduledAutoShare;
use App\Services\ScheduledAutoShareService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class DispatchScheduledAutoShare implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public function __construct(public int $shareId) {}

    public function handle(ScheduledAutoShareService $autoShare): void
    {
        $share = ScheduledAutoShare::query()->find($this->shareId);
        if ($share === null) {
            return;
        }

        $autoShare->run($share);
    }

    public function failed(?Throwable $exception): void
    {
        $share = ScheduledAutoShare::query()->find($this->shareId);
        if ($share === null) {
            return;
        }

        Log::warning('Scheduled auto-share job failed', [
            'share_id' => $this->shareId,
            'error' => $exception?->getMessage(),
        ]);

        if (in_array($share->status, ['pending', 'running'], true)) {
            $share->forceFill([
                'status' => 'failed',
                'finished_at' => now(),
                'last_error' => $exception?->getMessage() ?: 'Auto-share job failed',
            ])->save();

            app(ScheduledAutoShareService::class)->refundUnusedCredits($share->fresh());
        }
    }
}
