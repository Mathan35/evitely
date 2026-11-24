<?php

namespace App\Http\Middleware;

use App\Services\PlatformReadinessService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Platform owner gate. Authenticated non-owners get 404 (no admin surface leakage).
 * Guests are redirected to /admin/login by the auth middleware redirectGuestsTo.
 */
class EnsurePlatformAdmin
{
    public function __construct(private PlatformReadinessService $platform) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || ! $this->platform->isAdmin($user)) {
            abort(404);
        }

        $response = $next($request);

        $response->headers->set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        $response->headers->set('Cache-Control', 'no-store, private');
        $response->headers->set('Referrer-Policy', 'no-referrer');

        return $response;
    }
}
