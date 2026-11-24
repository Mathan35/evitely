<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Heartbeat so Ops can detect whether cron is actually running schedule:run.
Schedule::call(function (): void {
    Cache::put('platform:scheduler_heartbeat', now()->timestamp, now()->addDay());
})->everyMinute()->name('platform-scheduler-heartbeat');

Schedule::command('billing:site-lifecycle')->everyFiveMinutes();

Schedule::command('rsvp:remind')->dailyAt('09:00');

$digestHour = max(0, min(23, (int) config('platform.host_digest_hour', 8)));
Schedule::command('host:digest')
    ->dailyAt(sprintf('%02d:00', $digestHour))
    ->when(fn (): bool => (bool) config('platform.host_digest_enabled', true));
