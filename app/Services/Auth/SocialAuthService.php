<?php

namespace App\Services\Auth;

use App\Models\SocialAccount;
use App\Models\User;
use App\Services\Growth\GrowthService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Contracts\User as SocialiteUser;

class SocialAuthService
{
    /** @var list<string> */
    public const PROVIDERS = ['google', 'apple', 'facebook'];

    public function __construct(private GrowthService $growth) {}

    public function isConfigured(string $provider): bool
    {
        if (! in_array($provider, self::PROVIDERS, true)) {
            return false;
        }

        $clientId = (string) config("services.{$provider}.client_id");

        if ($clientId === '') {
            return false;
        }

        if ($provider === 'apple') {
            $secret = (string) config('services.apple.client_secret');
            $privateKey = (string) config('services.apple.private_key');
            $keyId = (string) config('services.apple.key_id');
            $teamId = (string) config('services.apple.team_id');

            return $secret !== '' || ($privateKey !== '' && $keyId !== '' && $teamId !== '');
        }

        return filled(config("services.{$provider}.client_secret"));
    }

    /**
     * @return list<string>
     */
    public function enabledProviders(): array
    {
        return array_values(array_filter(
            self::PROVIDERS,
            fn (string $provider): bool => $this->isConfigured($provider),
        ));
    }

    /**
     * Find or create a local user from a Socialite identity.
     *
     * @param  array{referral_code?: string|null, partner_code?: string|null}  $signupCodes
     */
    public function resolveUser(string $provider, SocialiteUser $socialUser, array $signupCodes = []): User
    {
        if (! in_array($provider, self::PROVIDERS, true)) {
            throw ValidationException::withMessages([
                'provider' => 'Unsupported sign-in provider.',
            ]);
        }

        $providerId = (string) $socialUser->getId();
        if ($providerId === '') {
            throw ValidationException::withMessages([
                'provider' => 'The provider did not return a usable account id.',
            ]);
        }

        $email = Str::lower(trim((string) ($socialUser->getEmail() ?? '')));
        $name = trim((string) ($socialUser->getName() ?? ''));
        $avatar = $socialUser->getAvatar() ?: null;

        return DB::transaction(function () use ($provider, $providerId, $email, $name, $avatar, $socialUser, $signupCodes): User {
            $account = SocialAccount::query()
                ->where('provider', $provider)
                ->where('provider_id', $providerId)
                ->first();

            if ($account) {
                $user = $account->user;
                $this->assertActive($user);
                $this->syncAccount($account, $socialUser, $avatar);
                $this->fillMissingProfile($user, $name, $email, $avatar);

                return $user->fresh() ?? $user;
            }

            $user = $email !== ''
                ? User::query()->whereRaw('lower(email) = ?', [$email])->first()
                : null;

            if ($user) {
                $this->assertActive($user);
            } else {
                if ($email === '') {
                    throw ValidationException::withMessages([
                        'email' => 'This provider did not share an email address. Use another sign-in method, or allow email access and try again.',
                    ]);
                }

                $user = User::query()->create([
                    'name' => $name !== '' ? $name : Str::before($email, '@'),
                    'email' => $email,
                    'password' => null,
                    'avatar' => $avatar,
                    'email_verified_at' => now(),
                ]);

                $this->growth->ensureReferralCode($user);
                $this->growth->attachSignupCodes(
                    $user,
                    $signupCodes['referral_code'] ?? null,
                    $signupCodes['partner_code'] ?? null,
                );
            }

            $this->linkAccount($user, $provider, $providerId, $socialUser, $avatar);
            $this->fillMissingProfile($user, $name, $email, $avatar);

            return $user->fresh() ?? $user;
        });
    }

    private function assertActive(User $user): void
    {
        if ($user->isDisabled()) {
            throw ValidationException::withMessages([
                'email' => 'This account has been disabled. Contact support if you need help.',
            ]);
        }
    }

    private function linkAccount(
        User $user,
        string $provider,
        string $providerId,
        SocialiteUser $socialUser,
        ?string $avatar,
    ): SocialAccount {
        $account = new SocialAccount([
            'user_id' => $user->id,
            'provider' => $provider,
            'provider_id' => $providerId,
        ]);

        $this->syncAccount($account, $socialUser, $avatar);
        $account->save();

        return $account;
    }

    private function syncAccount(SocialAccount $account, SocialiteUser $socialUser, ?string $avatar): void
    {
        $account->avatar = $avatar;
        $account->token = method_exists($socialUser, 'token') ? $socialUser->token : null;
        $account->refresh_token = $socialUser->refreshToken ?? null;

        $expiresIn = $socialUser->expiresIn ?? null;
        $account->token_expires_at = is_numeric($expiresIn)
            ? now()->addSeconds((int) $expiresIn)
            : null;

        if ($account->exists) {
            $account->save();
        }
    }

    private function fillMissingProfile(User $user, string $name, string $email, ?string $avatar): void
    {
        $dirty = false;

        if ($user->name === '' && $name !== '') {
            $user->name = $name;
            $dirty = true;
        }

        if ($user->avatar === null && $avatar !== null) {
            $user->avatar = $avatar;
            $dirty = true;
        }

        if ($user->email_verified_at === null && $email !== '' && Str::lower($user->email) === $email) {
            $user->email_verified_at = now();
            $dirty = true;
        }

        if ($dirty) {
            $user->save();
        }
    }
}
