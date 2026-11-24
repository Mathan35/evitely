<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MarketingSeoTest extends TestCase
{
    use RefreshDatabase;

    public function test_sitemap_lists_core_marketing_urls(): void
    {
        $response = $this->get('/sitemap.xml');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/xml; charset=UTF-8');
        $response->assertSee('<urlset', false);
        $response->assertSee(url('/'), false);
        $response->assertSee(url('/designs'), false);
        $response->assertSee(url('/indian-wedding-invitation'), false);
        $response->assertSee(url('/wedding-rsvp'), false);
        $response->assertSee(url('/privacy'), false);
    }

    public function test_robots_txt_points_at_sitemap_and_blocks_studio(): void
    {
        $response = $this->get('/robots.txt');

        $response->assertOk();
        $response->assertSee('Sitemap: '.url('/sitemap.xml'), false);
        $response->assertSee('Disallow: /admin', false);
        $response->assertSee('Disallow: /dashboard', false);
        $response->assertSee('Disallow: /events', false);
    }

    public function test_home_payload_includes_search_console_seo(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('welcome')
                ->has('seo.title')
                ->has('seo.description')
                ->has('seo.canonical')
                ->has('seo.image')
                ->has('seo.json_ld')
                ->where('seo.canonical', url('/'))
                ->has('seo.faqs.0.q')
                ->has('seo.json_ld.0.@type'));
    }

    public function test_seo_landing_includes_canonical_and_faq_schema(): void
    {
        $this->get(route('seo.indian-wedding-invitation'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('seo/landing')
                ->has('seo')
                ->has('seo.json_ld.0')
                ->has('seo.faqs.0.q')
                ->where('seo.canonical', url('/indian-wedding-invitation'))
                ->where('seo.json_ld.0.@type', 'FAQPage'));
    }
}
