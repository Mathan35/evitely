<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\RegisterResponse;
use Symfony\Component\HttpFoundation\Response;

class ModalAwareRegisterResponse implements RegisterResponse
{
    public function toResponse($request): Response
    {
        if ($request->boolean('modal')) {
            return back();
        }

        return redirect()->intended(config('fortify.home'));
    }
}
