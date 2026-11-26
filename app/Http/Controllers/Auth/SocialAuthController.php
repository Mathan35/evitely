<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\SocialAuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class SocialAuthController extends Controller
{
    public function redirect(Request $request, string $provider, SocialAuthService $social): Response
    {
        $provider = strtolower($provider);
        abort_unless(in_array($provider, SocialAuthService::PROVIDERS, true), 404);

        if (! $social->isConfigured($provider)) {
            return $this->failed($request, 'Sign in with '.ucfirst($provider).' is not configured yet. Use email, or enable it in Admin → Integrations.');
        }

        $request->session()->put('social_auth.intended', $request->query('redirect'));
        $request->session()->put('social_auth.referral_code', $request->query('referral_code', $request->query('ref')));
        $request->session()->put('social_auth.partner_code', $request->query('partner_code', $request->query('partner')));

        // Always use the live HTTPS callback so Google/Facebook reject insecure APP_URL values.
        $callback = $this->callbackUrl($provider);

        return Socialite::driver($provider)->redirectUrl($callback)->redirect();
    }

    public function callback(Request $request, string $provider, SocialAuthService $social): Response
    {
        $provider = strtolower($provider);
        abort_unless(in_array($provider, SocialAuthService::PROVIDERS, true), 404);

        if (! $social->isConfigured($provider)) {
            return $this->failed($request, 'Sign in with '.ucfirst($provider).' is not configured yet.');
        }

        try {
            $callback = $this->callbackUrl($provider);
            $socialUser = Socialite::driver($provider)->redirectUrl($callback)->user();

            $user = $social->resolveUser($provider, $socialUser, [
                'referral_code' => $request->session()->pull('social_auth.referral_code'),
                'partner_code' => $request->session()->pull('social_auth.partner_code'),
            ]);
        } catch (ValidationException $e) {
            $message = collect($e->errors())->flatten()->first() ?: 'Could not complete social sign-in.';

            return $this->failed($request, (string) $message);
        } catch (Throwable $e) {
            report($e);

            return $this->failed($request, 'Could not complete sign-in with '.ucfirst($provider).'. Please try again or use email.');
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        $intended = $request->session()->pull('social_auth.intended');
        if (is_string($intended) && $intended !== '' && str_starts_with($intended, '/')) {
            return redirect()->to($intended);
        }

        return redirect()->intended((string) config('fortify.home', '/events'));
    }

    private function failed(Request $request, string $message): RedirectResponse
    {
        Inertia::flash('toast', [
            'type' => 'error',
            'message' => $message,
        ]);

        return redirect()->to('/login')->withErrors([
            'email' => $message,
        ]);
    }

    private function callbackUrl(string $provider): string
    {
        $configured = (string) config("services.{$provider}.redirect");
        if ($configured !== '' && str_starts_with($configured, 'https://')) {
            return $configured;
        }

        return url('/auth/'.$provider.'/callback');
    }
}
