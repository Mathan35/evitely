<?php

namespace App\Http\Responses;

use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse;
use Symfony\Component\HttpFoundation\Response;

class ModalAwareLoginResponse implements LoginResponse
{
    public function toResponse($request): Response
    {
        if ($this->fromModal($request)) {
            return back();
        }

        return redirect()->intended(config('fortify.home'));
    }

    private function fromModal(Request $request): bool
    {
        return $request->boolean('modal');
    }
}
