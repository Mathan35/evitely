<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportMessage;
use App\Services\Admin\AdminAuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SupportController extends Controller
{
    public function index(Request $request): Response
    {
        $q = trim((string) $request->query('q', ''));
        $status = trim((string) $request->query('status', 'open'));
        $topic = trim((string) $request->query('topic', ''));

        $messages = SupportMessage::query()
            ->with(['user:id,name,email'])
            ->when($q !== '', function ($query) use ($q): void {
                $query->where(function ($inner) use ($q): void {
                    $inner->where('name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%")
                        ->orWhere('message', 'like', "%{$q}%")
                        ->orWhere('page_url', 'like', "%{$q}%");
                });
            })
            ->when($status === 'open', fn ($query) => $query->open())
            ->when(
                in_array($status, array_keys(SupportMessage::STATUSES), true),
                fn ($query) => $query->where('status', $status),
            )
            ->when(
                $topic !== '' && array_key_exists($topic, SupportMessage::TOPICS),
                fn ($query) => $query->where('topic', $topic),
            )
            ->latest('id')
            ->paginate(30)
            ->withQueryString()
            ->through(fn (SupportMessage $m): array => $this->serialize($m));

        return Inertia::render('admin/support/index', [
            'messages' => $messages,
            'filters' => [
                'q' => $q,
                'status' => $status,
                'topic' => $topic,
            ],
            'topics' => SupportMessage::TOPICS,
            'statuses' => SupportMessage::STATUSES,
            'counts' => [
                'new' => SupportMessage::query()->where('status', 'new')->count(),
                'open' => SupportMessage::query()->open()->count(),
                'resolved' => SupportMessage::query()->where('status', 'resolved')->count(),
                'all' => SupportMessage::query()->count(),
            ],
        ]);
    }

    public function show(Request $request, SupportMessage $support): Response
    {
        $support->loadMissing(['user:id,name,email']);

        // Opening a brand-new message marks it read — but never undo an explicit
        // status change from the Actions panel on the redirect back.
        if (
            $support->status === 'new'
            && ! $request->session()->pull('support_skip_auto_read', false)
        ) {
            $support->markRead();
            $support->refresh();
        }

        return Inertia::render('admin/support/show', [
            'message' => $this->serialize($support->loadMissing(['user:id,name,email'])),
            'topics' => SupportMessage::TOPICS,
            'statuses' => SupportMessage::STATUSES,
        ]);
    }

    public function update(Request $request, SupportMessage $support, AdminAuditLogger $audit): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'string', Rule::in(array_keys(SupportMessage::STATUSES))],
        ]);

        match ($data['status']) {
            'resolved' => $support->markResolved(),
            'read' => $support->forceFill(['status' => 'read', 'resolved_at' => null])->save(),
            'new' => $support->forceFill(['status' => 'new', 'resolved_at' => null])->save(),
            default => null,
        };

        $audit->log($request->user(), 'support.update', $support, $data, $request);

        return back()->with('support_skip_auto_read', true);
    }

    public function destroy(Request $request, SupportMessage $support, AdminAuditLogger $audit): RedirectResponse
    {
        $audit->log($request->user(), 'support.delete', $support, ['id' => $support->id], $request);
        $support->delete();

        return redirect()->route('admin.support.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(SupportMessage $m): array
    {
        return [
            'id' => $m->id,
            'name' => $m->name,
            'email' => $m->email,
            'topic' => $m->topic,
            'topic_label' => $m->topicLabel(),
            'message' => $m->message,
            'page_url' => $m->page_url,
            'status' => $m->status,
            'status_label' => $m->statusLabel(),
            'user_id' => $m->user_id,
            'user_name' => $m->user?->name,
            'ip_address' => $m->ip_address,
            'user_agent' => $m->user_agent,
            'resolved_at' => $m->resolved_at?->toIso8601String(),
            'created_at' => $m->created_at?->toIso8601String(),
        ];
    }
}
