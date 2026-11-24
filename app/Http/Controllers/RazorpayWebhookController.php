<?php

namespace App\Http\Controllers;

use App\Services\Billing\RazorpayService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class RazorpayWebhookController extends Controller
{
    public function __invoke(Request $request, RazorpayService $razorpay): Response
    {
        $raw = $request->getContent();
        $signature = (string) $request->header('X-Razorpay-Signature', '');

        try {
            $razorpay->assertValidWebhookSignature($raw, $signature);
        } catch (ValidationException $e) {
            Log::warning('Razorpay webhook rejected', [
                'errors' => $e->errors(),
            ]);

            return response('Invalid signature', 400);
        }

        /** @var array<string, mixed> $payload */
        $payload = json_decode($raw, true) ?: [];
        $razorpay->handleWebhook($payload, $signature);

        return response('ok', 200);
    }
}
