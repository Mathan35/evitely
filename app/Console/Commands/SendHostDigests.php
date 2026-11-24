<?php

namespace App\Console\Commands;

use App\Services\HostDigestService;
use Illuminate\Console\Command;

class SendHostDigests extends Command
{
    protected $signature = 'host:digest {--hours=24 : Lookback window in hours}';

    protected $description = 'Email hosts a digest of new RSVPs, wishes, and guest photos';

    public function handle(HostDigestService $digests): int
    {
        $hours = max(1, (int) $this->option('hours'));
        $result = $digests->sendDaily(now()->subHours($hours));

        $this->info(sprintf(
            'Host digests sent=%d skipped=%d failed=%d',
            $result['sent'],
            $result['skipped'],
            $result['failed'],
        ));

        return self::SUCCESS;
    }
}
