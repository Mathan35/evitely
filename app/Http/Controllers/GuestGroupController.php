<?php

namespace App\Http\Controllers;

use App\Http\Requests\Weddings\StoreGuestGroupRequest;
use App\Models\GuestGroup;
use App\Models\Wedding;
use Illuminate\Http\RedirectResponse;

class GuestGroupController extends Controller
{
    public function store(StoreGuestGroupRequest $request, Wedding $wedding): RedirectResponse
    {
        $wedding->groups()->create($request->validated());

        return back();
    }

    public function destroy(Wedding $wedding, GuestGroup $group): RedirectResponse
    {
        abort_unless($group->event_id === $wedding->id, 404);
        $group->delete();

        return back();
    }
}
