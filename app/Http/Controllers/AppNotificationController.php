<?php

namespace App\Http\Controllers;

use App\Services\Notifications\AppNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppNotificationController extends Controller
{
    public function index(Request $request, AppNotificationService $notifications): Response
    {
        $user = $request->user();
        abort_unless($user, 401);

        $page = max(1, (int) $request->query('page', 1));
        $result = $notifications->paginate($user, $page, 40);

        // Use `items` — never overwrite the shared Inertia `notifications` snapshot
        // (bell dropdown feed) with this page's list payload.
        return Inertia::render('notifications/index', [
            'items' => $result['data'],
            'next_page' => $result['next_page'],
            'unread' => $notifications->snapshot($user, 1)['unread'],
        ]);
    }

    public function feed(Request $request, AppNotificationService $notifications): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $after = $request->query('after');
        $after = is_string($after) && $after !== '' ? $after : null;

        $items = $after
            ? $notifications->since($user, $after, 20)
            : $notifications->snapshot($user, 8)['recent'];

        $snapshot = $notifications->snapshot($user, 8);

        return response()->json([
            'unread' => $snapshot['unread'],
            'recent' => $snapshot['recent'],
            'items' => $items,
            'cursor' => $snapshot['cursor'],
            'server_time' => now()->toIso8601String(),
        ]);
    }

    public function markRead(Request $request, int $notification, AppNotificationService $notifications): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);
        $notifications->markRead($user, $notification);

        return response()->json(['ok' => true, 'unread' => $notifications->snapshot($user, 1)['unread']]);
    }

    public function markAllRead(Request $request, AppNotificationService $notifications): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);
        $notifications->markAllRead($user);

        return response()->json(['ok' => true, 'unread' => 0]);
    }

    public function clear(Request $request, AppNotificationService $notifications): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);
        $notifications->clearRecent($user);

        return response()->json([
            'ok' => true,
            'unread' => 0,
            'recent' => [],
        ]);
    }
}
