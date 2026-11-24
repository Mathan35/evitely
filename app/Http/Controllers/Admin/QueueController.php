<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WeddingGuest;
use App\Services\Admin\AdminAuditLogger;
use App\Services\PlatformReadinessService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class QueueController extends Controller
{
    public function index(PlatformReadinessService $platform): Response
    {
        $failed = DB::table('failed_jobs')->orderByDesc('id')->limit(50)->get()
            ->map(fn ($row): array => [
                'id' => (int) $row->id,
                'uuid' => (string) $row->uuid,
                'queue' => (string) $row->queue,
                'exception' => mb_substr((string) $row->exception, 0, 280),
                'failed_at' => (string) $row->failed_at,
            ]);

        $pending = 0;
        if (config('queue.default') === 'database') {
            $pending = (int) DB::table('jobs')->count();
        }

        $heartbeat = Cache::get('platform:scheduler_heartbeat');
        $age = is_numeric($heartbeat) ? max(0, time() - (int) $heartbeat) : null;

        $logTail = null;
        if (app()->environment(['local', 'testing', 'staging'])) {
            $path = storage_path('logs/laravel.log');
            if (is_file($path) && filesize($path) < 2_000_000) {
                $lines = file($path, FILE_IGNORE_NEW_LINES) ?: [];
                $logTail = array_slice($lines, -80);
            }
        }

        $remindable = WeddingGuest::query()
            ->whereNull('revoked_at')
            ->where('rsvp_status', 'pending')
            ->whereNotNull('email')
            ->count();

        return Inertia::render('admin/queues/index', [
            'failed_jobs' => $failed,
            'pending_count' => $pending,
            'failed_count' => (int) DB::table('failed_jobs')->count(),
            'scheduler_age_seconds' => $age,
            'log_channel' => (string) config('logging.default'),
            'log_level' => (string) config('logging.channels.'.config('logging.default').'.level', 'debug'),
            'log_tail' => $logTail,
            'support' => [
                'digest_due_hint' => $age === null
                    ? 'Scheduler heartbeat missing — digests/reminders may not run.'
                    : "Scheduler heartbeat {$age}s ago.",
                'remindable_guests' => $remindable,
                'checklist' => $platform->summary()['checklist'] ?? [],
            ],
        ]);
    }

    public function retry(Request $request, string $id, AdminAuditLogger $audit): RedirectResponse
    {
        $uuid = $this->resolveFailedJobUuid($id);
        abort_if($uuid === null, 404);
        Artisan::call('queue:retry', ['id' => [$uuid]]);
        $audit->log($request->user(), 'queue.retry', null, ['uuid' => $uuid], $request);

        return back()->with('toast', ['type' => 'success', 'message' => 'Job queued for retry.']);
    }

    public function forget(Request $request, string $id, AdminAuditLogger $audit): RedirectResponse
    {
        $uuid = $this->resolveFailedJobUuid($id);
        abort_if($uuid === null, 404);
        Artisan::call('queue:forget', ['id' => $uuid]);
        $audit->log($request->user(), 'queue.forget', null, ['uuid' => $uuid], $request);

        return back()->with('toast', ['type' => 'success', 'message' => 'Failed job deleted.']);
    }

    public function retryAll(Request $request, AdminAuditLogger $audit): RedirectResponse
    {
        Artisan::call('queue:retry', ['id' => ['all']]);
        $audit->log($request->user(), 'queue.retry_all', null, [], $request);

        return back()->with('toast', ['type' => 'success', 'message' => 'All failed jobs queued for retry.']);
    }

    public function runDigest(Request $request, AdminAuditLogger $audit): RedirectResponse
    {
        Artisan::call('host:digest');
        $audit->log($request->user(), 'ops.run_digest', null, ['output' => Artisan::output()], $request);

        return back()->with('toast', ['type' => 'success', 'message' => 'Host digest command finished.']);
    }

    public function runReminders(Request $request, AdminAuditLogger $audit): RedirectResponse
    {
        Artisan::call('rsvp:remind');
        $audit->log($request->user(), 'ops.run_reminders', null, ['output' => Artisan::output()], $request);

        return back()->with('toast', ['type' => 'success', 'message' => 'RSVP reminders command finished.']);
    }

    private function resolveFailedJobUuid(string $id): ?string
    {
        $row = DB::table('failed_jobs')
            ->where('uuid', $id)
            ->orWhere('id', $id)
            ->first();

        return $row ? (string) $row->uuid : null;
    }
}
