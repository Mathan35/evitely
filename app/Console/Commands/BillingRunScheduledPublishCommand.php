<?php

namespace App\Console\Commands;

use App\Models\Wedding;
use App\Services\Billing\SiteBillingService;
use Illuminate\Console\Command;

class BillingRunScheduledPublishCommand extends Command
{
    protected $signature = 'billing:run-scheduled-publish {eventId : Event (wedding) id}';

    protected $description = 'Force auto-publish + pack start for a paid awaiting_go_live event';

    public function handle(SiteBillingService $siteBilling): int
    {
        $wedding = Wedding::query()->findOrFail((int) $this->argument('eventId'));

        if ($wedding->site_billing_status !== 'awaiting_go_live') {
            $this->warn('Event is not awaiting_go_live (status='.$wedding->site_billing_status.').');
        }

        $siteBilling->activateGoLive($wedding);
        $wedding->refresh();

        $this->info('status='.$wedding->site_billing_status.' published='.($wedding->isPublic() ? 'yes' : 'no'));

        return self::SUCCESS;
    }
}
