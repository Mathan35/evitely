<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Wedding;
use App\Services\Admin\AdminAuditLogger;
use App\Services\Admin\AdminPackGrantService;
use App\Services\Billing\PlanCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PackGrantController extends Controller
{
    public function index(Request $request, PlanCatalog $catalog, AdminPackGrantService $grants): Response
    {
        $prefillUserId = (int) $request->query('user_id', 0);
        $prefillEventId = (int) $request->query('event_id', 0);

        $prefillUser = null;
        $prefillEvents = [];
        if ($prefillUserId > 0) {
            $user = User::query()->find($prefillUserId);
            if ($user) {
                $prefillUser = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ];
                $prefillEvents = $user->weddings()
                    ->latest('id')
                    ->limit(50)
                    ->get(['id', 'title', 'site_billing_status', 'site_pack_sku'])
                    ->map(fn (Wedding $w): array => [
                        'id' => $w->id,
                        'title' => $w->displayTitle(),
                        'site_billing_status' => $w->site_billing_status,
                        'site_pack_sku' => $w->site_pack_sku,
                    ])
                    ->values()
                    ->all();
            }
        }

        return Inertia::render('admin/grants/index', [
            'grants' => $grants->recentGrants(50),
            'catalog' => [
                'site_packs' => collect($catalog->sitePacks())->map(fn (array $row, string $key): array => [
                    'id' => $key,
                    'name' => $row['name'] ?? $key,
                    'days' => (int) ($row['days'] ?? 0),
                    'included_credits' => (int) ($row['included_credits'] ?? 0),
                    'price_label_inr' => $row['price_label_inr'] ?? null,
                    'price_label_bare_inr' => $row['price_label_bare_inr'] ?? null,
                ])->values()->all(),
                'credit_packs' => collect($catalog->creditPacks())->map(fn (array $row, string $key): array => [
                    'id' => $key,
                    'name' => $row['name'] ?? $key,
                    'credits' => (int) ($row['credits'] ?? 0),
                    'price_label_inr' => $row['price_label_inr'] ?? null,
                ])->values()->all(),
            ],
            'users' => User::query()
                ->latest('id')
                ->limit(200)
                ->get(['id', 'name', 'email'])
                ->map(fn (User $u): array => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'label' => trim(($u->name ?: 'User').' · '.$u->email),
                ])
                ->values()
                ->all(),
            'prefill' => [
                'user_id' => $prefillUser['id'] ?? null,
                'event_id' => $prefillEventId > 0 ? $prefillEventId : null,
                'user' => $prefillUser,
                'events' => $prefillEvents,
            ],
        ]);
    }

    public function store(
        Request $request,
        AdminPackGrantService $grants,
        PlanCatalog $catalog,
        AdminAuditLogger $audit,
    ): RedirectResponse {
        $siteKeys = array_keys($catalog->sitePacks());
        $creditKeys = array_keys($catalog->creditPacks());

        $data = $request->validate([
            'mode' => ['required', Rule::in(['existing', 'new'])],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:190'],
            'event_id' => ['nullable', 'integer', 'exists:events,id'],
            'event_title' => ['nullable', 'string', 'max:190'],
            'site_pack_sku' => ['required', 'string', Rule::in($siteKeys)],
            'credit_pack_sku' => ['nullable', 'string', Rule::in($creditKeys)],
            'include_site_credits' => ['sometimes', 'boolean'],
            'pricing' => ['required', Rule::in(['free', 'paid', 'complimentary'])],
            'go_live_mode' => ['required', Rule::in(['now', 'schedule'])],
            'note' => ['nullable', 'string', 'max:500'],
            'send_email' => ['sometimes', 'boolean'],
        ]);

        $data['include_site_credits'] = $request->boolean('include_site_credits');
        $data['send_email'] = $request->boolean('send_email', true);
        if (($data['credit_pack_sku'] ?? '') === '') {
            $data['credit_pack_sku'] = null;
        }

        $result = $grants->grant($request->user(), $data);

        $audit->log($request->user(), 'pack.grant', $result['wedding'], [
            'grant_id' => $result['grant_id'],
            'user_id' => $result['user']->id,
            'created_user' => $result['created_user'],
            'site_pack_sku' => $data['site_pack_sku'],
            'credit_pack_sku' => $data['credit_pack_sku'],
            'pricing' => $data['pricing'],
            'payment_ids' => collect($result['payments'])->pluck('id')->all(),
        ], $request);

        $message = $result['created_user']
            ? 'Account created, pack assigned, and invite email queued.'
            : 'Pack assigned to user. They can use it after login.';

        return redirect()
            ->route('admin.grants.index', ['user_id' => $result['user']->id])
            ->with('toast', ['type' => 'success', 'message' => $message]);
    }

    public function userEvents(User $user): \Illuminate\Http\JsonResponse
    {
        $events = $user->weddings()
            ->latest('id')
            ->limit(50)
            ->get(['id', 'title', 'site_billing_status', 'site_pack_sku'])
            ->map(fn (Wedding $w): array => [
                'id' => $w->id,
                'title' => $w->displayTitle(),
                'site_billing_status' => $w->site_billing_status,
                'site_pack_sku' => $w->site_pack_sku,
            ])
            ->values()
            ->all();

        return response()->json(['events' => $events]);
    }
}
