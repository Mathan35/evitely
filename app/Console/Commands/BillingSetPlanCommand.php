<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\Billing\BillingService;
use Illuminate\Console\Command;

class BillingSetPlanCommand extends Command
{
    protected $signature = 'billing:set {email : User email} {plan : free|pro} {--credits= : Override message credits}';

    protected $description = 'Ops override: set Free/Pro + optional message credits (support / staging)';

    public function handle(BillingService $billing): int
    {
        $email = strtolower(trim((string) $this->argument('email')));
        $plan = strtolower(trim((string) $this->argument('plan')));
        $user = User::query()->whereRaw('lower(email) = ?', [$email])->first();

        if ($user === null) {
            $this->error('User not found.');

            return self::FAILURE;
        }

        if (! in_array($plan, ['free', 'pro'], true)) {
            $this->error('Plan must be free or pro.');

            return self::FAILURE;
        }

        if ($plan === 'pro') {
            $billing->activateSeason($user, app(\App\Services\Billing\PlanCatalog::class)->defaultSeasonKey());
        } else {
            $billing->downgradeToFree($user);
        }

        if ($this->option('credits') !== null) {
            $user->forceFill([
                'message_credits' => max(0, (int) $this->option('credits')),
            ])->save();
        }

        $user->refresh();
        $this->info(sprintf(
            '%s → plan=%s credits=%d',
            $user->email,
            $billing->effectivePlan($user),
            $billing->messageCredits($user),
        ));

        return self::SUCCESS;
    }
}
