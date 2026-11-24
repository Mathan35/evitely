<?php

namespace App\Providers;

use App\Http\Responses\ModalAwareLoginResponse;
use App\Http\Responses\ModalAwareRegisterResponse;
use App\Models\User;
use App\Models\WeddingGuest;
use App\Policies\GuestPolicy;
use App\Services\Admin\IntegrationSecretsService;
use App\Services\Growth\GrowthService;
use App\Services\PlatformReadinessService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Cashier\Cashier;
use Laravel\Fortify\Contracts\LoginResponse;
use Laravel\Fortify\Contracts\RegisterResponse;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(LoginResponse::class, ModalAwareLoginResponse::class);
        $this->app->singleton(RegisterResponse::class, ModalAwareRegisterResponse::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Cashier::ignoreRoutes();
        $this->configureDefaults();

        try {
            app(IntegrationSecretsService::class)->applyToConfig();
        } catch (\Throwable) {
            // Table may not exist yet during migrate / first boot.
        }

        try {
            app(GrowthService::class)->seedPartnerCodes();
        } catch (\Throwable) {
            // Partner table may not exist yet during migrate.
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Gate::policy(WeddingGuest::class, GuestPolicy::class);

        Gate::define('platform-admin', function (?User $user): bool {
            return $user !== null && app(PlatformReadinessService::class)->isAdmin($user);
        });

        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
