<?php

namespace App\Http\Controllers;

use App\Models\Wedding;
use App\Services\Growth\GrowthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class EventGrowthController extends Controller
{
    public function recordShare(Wedding $wedding, GrowthService $growth): JsonResponse
    {
        Gate::authorize('update', $wedding);

        return response()->json([
            'growth' => $growth->recordShare($wedding),
        ]);
    }
}
