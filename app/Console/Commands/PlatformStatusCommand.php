<?php

namespace App\Console\Commands;

use App\Services\PlatformReadinessService;
use Illuminate\Console\Command;

class PlatformStatusCommand extends Command
{
    protected $signature = 'platform:status';

    protected $description = 'Show Twilio / mail / queue / subdomain readiness checklist';

    public function handle(PlatformReadinessService $platform): int
    {
        $summary = $platform->summary();
        $this->info('Mailer: '.$summary['mailer']);
        $this->info('Queue: '.$summary['queue']);
        $this->info('Twilio email/sms/wa: '.json_encode($summary['twilio']));
        $this->info('Subdomains: '.($summary['subdomains']['enabled'] ? 'on ('.$summary['subdomains']['root'].')' : 'off'));

        $rows = collect($summary['checklist'])->map(fn (array $row): array => [
            $row['done'] ? 'yes' : 'no',
            $row['group'],
            $row['label'],
            $row['hint'],
        ])->all();

        $this->table(['Done', 'Group', 'Check', 'Hint'], $rows);

        return self::SUCCESS;
    }
}