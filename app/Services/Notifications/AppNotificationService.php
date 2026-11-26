<?php

namespace App\Services\Notifications;

use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AppNotificationService
{
    public function tablesReady(): bool
    {
        try {
            return Schema::hasTable('app_notifications');
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Upsert by group_key so repeat celebrate/RSVP bumps a count instead of spamming rows.
     *
     * @param  array<string, mixed>  $data
     */
    public function push(
        User $user,
        string $type,
        string $groupKey,
        string $title,
        ?string $body = null,
        array $data = [],
        bool $increment = true,
    ): ?AppNotification {
        if (! $this->tablesReady()) {
            return null;
        }

        $groupKey = Str::limit($groupKey, 120, '');

        return DB::transaction(function () use ($user, $type, $groupKey, $title, $body, $data, $increment) {
            $existing = AppNotification::query()
                ->where('user_id', $user->id)
                ->where('group_key', $groupKey)
                ->lockForUpdate()
                ->first();

            if ($existing) {
                $existing->forceFill([
                    'type' => $type,
                    'title' => $title,
                    'body' => $body,
                    'data' => array_merge($existing->data ?? [], $data, [
                        'count' => $increment ? ((int) $existing->count + 1) : (int) $existing->count,
                    ]),
                    'count' => $increment ? ((int) $existing->count + 1) : max(1, (int) $existing->count),
                    'read_at' => null,
                    'cleared_at' => null,
                    'last_occurred_at' => now(),
                ])->save();

                return $existing->fresh();
            }

            return AppNotification::query()->create([
                'user_id' => $user->id,
                'type' => $type,
                'group_key' => $groupKey,
                'title' => $title,
                'body' => $body,
                'count' => 1,
                'data' => $data,
                'read_at' => null,
                'last_occurred_at' => now(),
            ]);
        });
    }

    /**
     * @return array{
     *   unread: int,
     *   recent: list<array<string, mixed>>,
     *   cursor: ?string
     * }
     */
    public function snapshot(?User $user, int $recentLimit = 8): array
    {
        if (! $user || ! $this->tablesReady()) {
            return ['unread' => 0, 'recent' => [], 'cursor' => null];
        }

        $recent = AppNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('cleared_at')
            ->orderByDesc('last_occurred_at')
            ->orderByDesc('id')
            ->limit($recentLimit)
            ->get()
            ->map(fn (AppNotification $n) => $this->toPublic($n))
            ->values()
            ->all();

        $unread = AppNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('cleared_at')
            ->whereNull('read_at')
            ->count();

        $cursor = $recent[0]['last_occurred_at'] ?? null;

        return [
            'unread' => $unread,
            'recent' => $recent,
            'cursor' => $cursor,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function since(User $user, ?string $afterIso, int $limit = 20): array
    {
        if (! $this->tablesReady()) {
            return [];
        }

        $query = AppNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('cleared_at')
            ->orderByDesc('last_occurred_at')
            ->orderByDesc('id')
            ->limit($limit);

        if ($afterIso) {
            try {
                $after = \Illuminate\Support\Carbon::parse($afterIso);
                $query->where('last_occurred_at', '>', $after);
            } catch (\Throwable) {
                // ignore bad cursor
            }
        }

        return $query->get()->map(fn (AppNotification $n) => $this->toPublic($n))->values()->all();
    }

    /**
     * @return array{data: list<array<string, mixed>>, next_page: ?int}
     */
    public function paginate(User $user, int $page = 1, int $perPage = 30): array
    {
        if (! $this->tablesReady()) {
            return ['data' => [], 'next_page' => null];
        }

        $page = max(1, $page);
        $paginator = AppNotification::query()
            ->where('user_id', $user->id)
            ->orderByDesc('last_occurred_at')
            ->orderByDesc('id')
            ->paginate($perPage, ['*'], 'page', $page);

        return [
            'data' => collect($paginator->items())->map(fn (AppNotification $n) => $this->toPublic($n))->values()->all(),
            'next_page' => $paginator->hasMorePages() ? $page + 1 : null,
        ];
    }

    public function markRead(User $user, int $id): void
    {
        if (! $this->tablesReady()) {
            return;
        }

        AppNotification::query()
            ->where('user_id', $user->id)
            ->where('id', $id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function markAllRead(User $user): void
    {
        if (! $this->tablesReady()) {
            return;
        }

        AppNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('cleared_at')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    /** Hide from the bell dropdown; rows stay visible on the all-notifications page. */
    public function clearRecent(User $user): void
    {
        if (! $this->tablesReady()) {
            return;
        }

        AppNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('cleared_at')
            ->update([
                'cleared_at' => now(),
                'read_at' => now(),
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function toPublic(AppNotification $n): array
    {
        return [
            'id' => $n->id,
            'type' => $n->type,
            'title' => $n->title,
            'body' => $n->body,
            'count' => max(1, (int) $n->count),
            'href' => is_string($n->data['href'] ?? null) ? $n->data['href'] : null,
            'actor_name' => is_string($n->data['actor_name'] ?? null) ? $n->data['actor_name'] : null,
            'read' => $n->read_at !== null,
            'cleared' => $n->cleared_at !== null,
            'last_occurred_at' => $n->last_occurred_at?->toIso8601String(),
            'data' => $n->data ?? [],
        ];
    }
}
