<?php

namespace Tests\Feature;

use Tests\TestCase;

class LegalPagesTest extends TestCase
{
    public function test_privacy_terms_and_cookies_pages_render(): void
    {
        $this->get(route('legal.privacy'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('legal/privacy'));

        $this->get(route('legal.terms'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('legal/terms'));

        $this->get(route('legal.cookies'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('legal/cookies'));

        $this->get(route('legal.refund'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('legal/refund'));

        $this->get(route('legal.cancellation'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('legal/cancellation'));
    }

    public function test_health_endpoint_is_ok(): void
    {
        $this->get('/up')->assertOk();
    }
}
