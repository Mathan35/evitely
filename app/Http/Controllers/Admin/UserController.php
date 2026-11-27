<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BillingPayment;
use App\Models\User;
use App\Services\Admin\AdminAuditLogger;
use App\Services\Admin\AdminEventInsightService;
use App\Services\Admin\AdminUserLifecycleService;
use App\Services\Billing\BillingService;
use App\Services\Billing\PlanCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $q = trim((string) $request->query('q', ''));
        $plan = trim((string) $request->query('plan', ''));
        $status = trim((string) $request->query('status', ''));

        $users = User::query()
            ->withCount('weddings')
            ->when($q !== '', function ($query) use ($q): void {
                $query->where(function ($inner) use ($q): void {
                    $inner->where('name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%");
                });
            })
            ->when(in_array($plan, ['free', 'pro'], true), fn ($query) => $query->where('plan', $plan))
            ->when($status === 'disabled', fn ($query) => $query->whereNotNull('disabled_at'))
            ->when($status === 'active', fn ($query) => $query->whereNull('disabled_at'))
            ->latest('id')
            ->paginate(30)
            ->withQueryString()
            ->through(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'plan' => $user->plan,
                'message_credits' => (int) $user->message_credits,
                'weddings_count' => (int) $user->weddings_count,
                'email_verified' => $user->email_verified_at !== null,
                'disabled' => $user->isDisabled(),
                'plan_ends_at' => $user->plan_ends_at?->toIso8601String(),
                'created_at' => $user->created_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => ['q' => $q, 'plan' => $plan, 'status' => $status],
        ]);
    }

    public function show(
        User $user,
        BillingService $billing,
        AdminEventInsightService $insights,
        AdminUserLifecycleService $lifecycle,
        Request $request,
    ): Response {
        $user->loadCount('weddings');
        $events = $user->weddings()
            ->with(['card:id,event_id,status,format'])
            ->withCount(['guests', 'rsvps'])
            ->latest('id')
            ->limit(50)
            ->get();
        $analytics = $insights->analyticsForEvents($events->pluck('id')->all());
        $impact = $lifecycle->impact($user, $request->user());

        return Inertia::render('admin/users/show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'plan' => $billing->effectivePlan($user),
                'raw_plan' => $user->plan,
                'message_credits' => $billing->messageCredits($user),
                'plan_ends_at' => $user->plan_ends_at?->toIso8601String(),
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                'disabled_at' => $user->disabled_at?->toIso8601String(),
                'two_factor' => filled($user->two_factor_confirmed_at),
                'stripe_id' => $user->stripe_id,
                'created_at' => $user->created_at?->toIso8601String(),
                'weddings_count' => (int) $user->weddings_count,
                'is_platform_admin' => $impact['is_platform_admin'],
                'is_self' => (int) $request->user()->id === (int) $user->id,
            ],
            'lifecycle' => $impact,
            'events' => $events->map(function ($w) use ($analytics): array {
                $stats = $analytics[$w->id] ?? ['views' => 0, 'unique_views' => 0, 'guest_views' => 0, 'qr_scans' => 0, 'shares' => 0];

                return [
                    'id' => $w->id,
                    'title' => $w->displayTitle(),
                    'slug' => $w->slug,
                    'status' => $w->status?->value ?? (string) $w->status,
                    'site_billing_status' => $w->site_billing_status,
                    'invitation_mode' => $w->invitation_mode,
                    'guests_count' => (int) $w->guests_count,
                    'rsvps_count' => (int) $w->rsvps_count,
                    'views' => ($stats['views'] ?? 0) + ($stats['guest_views'] ?? 0),
                    'unique_views' => $stats['unique_views'] ?? 0,
                    'qr_scans' => $stats['qr_scans'] ?? 0,
                    'shares' => $stats['shares'] ?? 0,
                    'card_status' => $w->card?->status,
                    'starts_on' => $w->starts_on?->toDateString(),
                ];
            })->values()->all(),
            'payments' => BillingPayment::query()
                ->where('user_id', $user->id)
                ->latest('id')
                ->limit(30)
                ->get()
                ->map(fn (BillingPayment $p): array => [
                    'id' => $p->id,
                    'sku' => $p->sku,
                    'status' => $p->status,
                    'amount_paise' => $p->amount_paise,
                    'provider' => $p->provider,
                    'paid_at' => $p->paid_at?->toIso8601String(),
                ]),
        ]);
    }

    public function update(Request $request, User $user, BillingService $billing, AdminAuditLogger $audit): RedirectResponse
    {
        $data = $request->validate([
            'plan' => ['required', Rule::in(['free', 'pro'])],
            'message_credits' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'plan_ends_at' => ['nullable', 'date'],
        ]);

        if ($data['plan'] === 'pro') {
            $billing->activateSeason($user, app(PlanCatalog::class)->defaultSeasonKey());
            if (! empty($data['plan_ends_at'])) {
                $user->forceFill(['plan_ends_at' => $data['plan_ends_at']])->save();
            }
        } else {
            $billing->downgradeToFree($user);
        }

        if (array_key_exists('message_credits', $data) && $data['message_credits'] !== null) {
            $user->forceFill(['message_credits' => (int) $data['message_credits']])->save();
        }

        $audit->log($request->user(), 'user.update_plan', $user, $data, $request);

        return back()->with('toast', ['type' => 'success', 'message' => 'User billing updated.']);
    }

    public function verify(Request $request, User $user, AdminAuditLogger $audit): RedirectResponse
    {
        if ($user->email_verified_at === null) {
            $user->forceFill(['email_verified_at' => now()])->save();
            $audit->log($request->user(), 'user.verify_email', $user, [], $request);
        }

        return back()->with('toast', ['type' => 'success', 'message' => 'Email marked verified.']);
    }

    public function disable(
        Request $request,
        User $user,
        AdminAuditLogger $audit,
        AdminUserLifecycleService $lifecycle,
    ): RedirectResponse {
        $result = $lifecycle->deactivate($user, $request->user());
        $audit->log($request->user(), 'user.disable', $user, $result, $request);

        $suffix = $result['unpublished'] > 0
            ? " {$result['unpublished']} live site(s) unpublished."
            : '';

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Account deactivated. Login blocked.'.$suffix,
        ]);
    }

    public function enable(
        Request $request,
        User $user,
        AdminAuditLogger $audit,
        AdminUserLifecycleService $lifecycle,
    ): RedirectResponse {
        $lifecycle->reactivate($user, $request->user());
        $audit->log($request->user(), 'user.enable', $user, [], $request);

        return back()->with('toast', ['type' => 'success', 'message' => 'Account reactivated.']);
    }

    public function destroy(
        Request $request,
        User $user,
        AdminAuditLogger $audit,
        AdminUserLifecycleService $lifecycle,
    ): RedirectResponse {
        $data = $request->validate([
            'confirmation' => ['required', 'string', 'max:255'],
            'acknowledge' => ['accepted'],
        ]);

        $email = $user->email;
        $name = $user->name;
        $id = $user->id;

        $snapshot = $lifecycle->purge($user, $request->user(), $data['confirmation']);

        // Subject row is gone — audit with null subject and full snapshot in meta.
        $audit->log($request->user(), 'user.purge', null, [
            'purged_user_id' => $id,
            'purged_email' => $email,
            'purged_name' => $name,
            'impact' => $snapshot['impact'] ?? [],
        ], $request);

        return redirect()
            ->route('admin.users.index')
            ->with('toast', [
                'type' => 'success',
                'message' => "Permanently deleted {$name} ({$email}) and all related data.",
            ]);
    }

    public function sendReset(Request $request, User $user, AdminAuditLogger $audit): RedirectResponse
    {
        Password::sendResetLink(['email' => $user->email]);
        $audit->log($request->user(), 'user.send_password_reset', $user, [], $request);

        return back()->with('toast', ['type' => 'success', 'message' => 'Password reset link sent.']);
    }
}
