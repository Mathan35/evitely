<?php

namespace App\Http\Middleware;

use App\Support\InviteHost;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RejectReservedInviteSubdomain
{
    public function handle(Request $request, Closure $next): Response
    {
        $slug = (string) $request->route('slug', '');

        if ($slug !== '' && InviteHost::isReserved($slug)) {
            abort(404);
        }

        return $next($request);
    }
}
