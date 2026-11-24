<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\BillingPayment;
use App\Models\User;
use App\Models\Wedding;
use App\Services\PlatformReadinessService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OpsController extends Controller
{
    public function index(Request $request, PlatformReadinessService $platform): Response
    {
        abort_unless($platform->isAdmin($request->user()), 403);

        $summary = $platform->summary();

        $users = User::query()
            ->withCount('weddings')
            ->latest('id')
            ->limit(40)
            ->get(['id', 'name', 'email', 'plan', 'message_credits', 'plan_ends_at', 'created_at'])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'plan' => $user->plan,
                'message_credits' => (int) $user->message_credits,
                'weddings_count' => (int) $user->weddings_count,
                'plan_ends_at' => $user->plan_ends_at?->toIso8601String(),
                'created_at' => $user->created_at?->toIso8601String(),
            ]);

        $events = Wedding::query()
            ->with(['user:id,name,email'])
            ->latest('id')
            ->limit(40)
            ->get()
            ->map(fn (Wedding $wedding): array => [
                'id' => $wedding->id,
                'title' => $wedding->displayTitle(),
                'slug' => $wedding->slug,
                'status' => $wedding->status?->value ?? (string) $wedding->status,
                'user' => [
                    'name' => $wedding->user?->name,
                    'email' => $wedding->user?->email,
                ],
                'starts_on' => $wedding->starts_on?->toDateString(),
                'created_at' => $wedding->created_at?->toIso8601String(),
            ]);

        $payments = BillingPayment::query()
            ->with(['user:id,name,email'])
            ->latest('id')
            ->limit(30)
            ->get()
            ->map(fn (BillingPayment $row): array => [
                'id' => $row->id,
                'user' => [
                    'name' => $row->user?->name,
                    'email' => $row->user?->email,
                ],
                'kind' => $row->kind,
                'sku' => $row->sku,
                'amount_label' => '₹'.number_format($row->amount_paise / 100, 0, '.', ','),
                'status' => $row->status,
                'paid_at' => $row->paid_at?->toIso8601String(),
            ]);

        return Inertia::render('settings/ops', [
            'platform' => $summary,
            'users' => $users,
            'events' => $events,
            'payments' => $payments,
            'webhook_url' => url('/razorpay/webhook'),
            'commands' => [
                'queue' => 'php artisan queue:work',
                'schedule' => '* * * * * php artisan schedule:run',
                'status' => 'php artisan platform:status',
                'billing' => 'php artisan billing:set you@email.com pro --credits=400',
            ],
        ]);
    }
}
