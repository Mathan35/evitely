<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $q = trim((string) $request->query('q', ''));
        $action = trim((string) $request->query('action', ''));

        $logs = AdminAuditLog::query()
            ->with(['actor:id,email,name'])
            ->when($q !== '', function ($query) use ($q): void {
                $query->where(function ($inner) use ($q): void {
                    $inner->where('action', 'like', "%{$q}%")
                        ->orWhere('subject_type', 'like', "%{$q}%")
                        ->orWhere('ip', 'like', "%{$q}%")
                        ->orWhereHas('actor', fn ($u) => $u->where('email', 'like', "%{$q}%"));
                });
            })
            ->when($action !== '', fn ($query) => $query->where('action', $action))
            ->latest('id')
            ->paginate(40)
            ->withQueryString()
            ->through(fn (AdminAuditLog $log): array => [
                'id' => $log->id,
                'action' => $log->action,
                'actor_email' => $log->actor?->email,
                'subject_type' => $log->subject_type,
                'subject_id' => $log->subject_id,
                'meta' => $log->meta,
                'ip' => $log->ip,
                'created_at' => $log->created_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/audit/index', [
            'logs' => $logs,
            'filters' => compact('q', 'action'),
        ]);
    }
}
