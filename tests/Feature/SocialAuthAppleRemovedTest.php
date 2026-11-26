<?php

use App\Services\Auth\SocialAuthService;

it('rejects apple and unknown social providers', function (): void {
    $this->get(route('social.redirect', 'apple'))->assertNotFound();
    $this->get(route('social.callback', 'apple'))->assertNotFound();
    expect(SocialAuthService::PROVIDERS)->not->toContain('apple');
});
