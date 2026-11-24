<?php

namespace App\Http\Controllers;

use App\Models\EventTable;
use App\Models\Wedding;
use App\Services\SeatingAutoAssignService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class EventTableController extends Controller
{
    public function store(Request $request, Wedding $wedding): RedirectResponse
    {
        Gate::authorize('update', $wedding);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $sort = (int) $wedding->tables()->max('sort_order') + 1;
        $wedding->tables()->create([
            'name' => $data['name'],
            'capacity' => $data['capacity'] ?? 8,
            'sort_order' => $sort,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Table added.']);

        return back();
    }

    public function update(Request $request, Wedding $wedding, EventTable $table): RedirectResponse
    {
        abort_unless($table->event_id === $wedding->id, 404);
        Gate::authorize('update', $wedding);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'capacity' => ['required', 'integer', 'min:1', 'max:50'],
        ]);

        $table->update($data);

        return back();
    }

    public function destroy(Wedding $wedding, EventTable $table): RedirectResponse
    {
        abort_unless($table->event_id === $wedding->id, 404);
        Gate::authorize('update', $wedding);
        $table->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Table removed.']);

        return back();
    }

    public function assign(Request $request, Wedding $wedding): RedirectResponse
    {
        Gate::authorize('update', $wedding);

        $data = $request->validate([
            'guest_id' => ['required', 'integer'],
            'table_id' => ['nullable', 'integer'],
        ]);

        $guest = $wedding->guests()->whereKey($data['guest_id'])->firstOrFail();
        $tableId = $data['table_id'] ?? null;
        if ($tableId !== null) {
            abort_unless($wedding->tables()->whereKey($tableId)->exists(), 422);
        }

        $guest->forceFill(['table_id' => $tableId])->save();

        return back();
    }

    public function autoAssign(Request $request, Wedding $wedding, SeatingAutoAssignService $seating): RedirectResponse
    {
        Gate::authorize('update', $wedding);

        $data = $request->validate([
            'reset' => ['sometimes', 'boolean'],
        ]);

        if ($wedding->tables()->count() === 0) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Add at least one table before auto-assign.',
            ]);

            return back();
        }

        $result = $seating->assign($wedding, (bool) ($data['reset'] ?? false));

        $message = sprintf(
            'Seated %d guest%s%s.',
            $result['assigned'],
            $result['assigned'] === 1 ? '' : 's',
            $result['remaining'] > 0
                ? sprintf(' · %d still need a table (capacity full)', $result['remaining'])
                : '',
        );

        Inertia::flash('toast', [
            'type' => $result['remaining'] > 0 ? 'warning' : 'success',
            'message' => $message,
        ]);

        return back();
    }
}
