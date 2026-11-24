<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventType;
use App\Services\Admin\AdminAuditLogger;
use App\Support\DesignGallery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/catalog/index', [
            'event_types' => EventType::query()->orderBy('sort_order')->orderBy('name')->get()
                ->map(fn (EventType $type): array => [
                    'id' => $type->id,
                    'name' => $type->name,
                    'slug' => $type->slug,
                    'category' => $type->category,
                    'is_active' => (bool) $type->is_active,
                    'sort_order' => (int) $type->sort_order,
                ]),
            'live_occasions' => collect(DesignGallery::occasions())
                ->map(fn (array $row): string => (string) ($row['slug'] ?? $row['id'] ?? ''))
                ->filter()
                ->values()
                ->all(),
            'note' => 'Design galleries are code-driven (DesignGallery). This page only toggles EventType rows and lists live occasions.',
        ]);
    }

    public function updateEventType(Request $request, EventType $eventType, AdminAuditLogger $audit): RedirectResponse
    {
        $data = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);
        $eventType->forceFill(['is_active' => $data['is_active']])->save();
        $audit->log($request->user(), 'catalog.event_type_toggle', $eventType, $data, $request);

        return back()->with('toast', ['type' => 'success', 'message' => 'Event type updated.']);
    }
}
