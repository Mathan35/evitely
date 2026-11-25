<?php

use App\Models\SocialAccount;
use App\Models\User;
use App\Services\Auth\SocialAuthService;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Contracts\Provider as SocialiteProvider;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

beforeEach(function (): void {
    config([
        'services.google.client_id' => 'google-client',
        'services.google.client_secret' => 'google-secret',
        'services.google.redirect' => 'http://localhost/auth/google/callback',
        'services.facebook.client_id' => 'facebook-client',
        'services.facebook.client_secret' => 'facebook-secret',
        'services.facebook.redirect' => 'http://localhost/auth/facebook/callback',
        'services.apple.client_id' => 'apple-client',
        'services.apple.client_secret' => 'apple-secret',
        'services.apple.redirect' => 'http://localhost/auth/apple/callback',
    ]);
});

function fakeSocialiteUser(string $id, string $email, string $name = 'Host User'): SocialiteUser
{
    $user = new SocialiteUser;
    $user->id = $id;
    $user->name = $name;
    $user->email = $email;
    $user->avatar = 'https://cdn.example/avatar.jpg';
    $user->token = 'access-token';
    $user->refreshToken = 'refresh-token';
    $user->expiresIn = 3600;

    return $user;
}

function mockSocialite(string $provider, SocialiteUser $user): void
{
    $driver = Mockery::mock(SocialiteProvider::class);
    $driver->shouldReceive('redirect')->andReturn(redirect('https://oauth.example/'.$provider));
    $driver->shouldReceive('user')->andReturn($user);
    $driver->shouldReceive('stateless')->andReturnSelf();
    $driver->shouldReceive('cookieNonce')->andReturnSelf();

    Socialite::shouldReceive('driver')->with($provider)->andReturn($driver);
}

it('lists configured social providers', function (): void {
    $enabled = app(SocialAuthService::class)->enabledProviders();

    expect($enabled)->toBe(['google', 'apple', 'facebook']);
});

it('redirects guests to the oauth provider', function (): void {
    mockSocialite('google', fakeSocialiteUser('g-1', 'host@example.com'));

    $this->get(route('social.redirect', 'google'))
        ->assertRedirect('https://oauth.example/google');
});

it('creates a passwordless user from a new google account', function (): void {
    mockSocialite('google', fakeSocialiteUser('g-42', 'newhost@example.com', 'New Host'));

    $this->get(route('social.callback', 'google'))
        ->assertRedirect();

    $user = User::query()->where('email', 'newhost@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->password)->toBeNull()
        ->and($user->email_verified_at)->not->toBeNull()
        ->and(Auth::id())->toBe($user->id);

    expect(SocialAccount::query()->where([
        'user_id' => $user->id,
        'provider' => 'google',
        'provider_id' => 'g-42',
    ])->exists())->toBeTrue();
});

it('links a google account to an existing email user', function (): void {
    $existing = User::factory()->create([
        'email' => 'linked@example.com',
        'password' => 'password',
    ]);

    mockSocialite('google', fakeSocialiteUser('g-99', 'linked@example.com', 'Linked Host'));

    $this->get(route('social.callback', 'google'))
        ->assertRedirect();

    expect(Auth::id())->toBe($existing->id);
    expect(SocialAccount::query()->where([
        'user_id' => $existing->id,
        'provider' => 'google',
        'provider_id' => 'g-99',
    ])->exists())->toBeTrue();
    expect(User::query()->where('email', 'linked@example.com')->count())->toBe(1);
});

it('rejects disabled accounts on social login', function (): void {
    User::factory()->create([
        'email' => 'disabled@example.com',
        'disabled_at' => now(),
    ]);

    mockSocialite('facebook', fakeSocialiteUser('fb-1', 'disabled@example.com'));

    $this->get(route('social.callback', 'facebook'))
        ->assertRedirect('/login')
        ->assertSessionHasErrors('email');

    expect(Auth::check())->toBeFalse();
});

it('blocks unconfigured providers with a clear error', function (): void {
    config([
        'services.google.client_id' => null,
        'services.google.client_secret' => null,
    ]);

    $this->get(route('social.redirect', 'google'))
        ->assertRedirect('/login')
        ->assertSessionHasErrors('email');
});

it('allows free card creation forever after social signup', function (): void {
    mockSocialite('apple', fakeSocialiteUser('a-1', 'apple@example.com', 'Apple Host'));

    $this->get(route('social.callback', 'apple'))->assertRedirect();

    $user = User::query()->where('email', 'apple@example.com')->firstOrFail();
    expect(app(\App\Services\Billing\BillingService::class)->canCreateEvent($user, 'card'))->toBeTrue();
});
