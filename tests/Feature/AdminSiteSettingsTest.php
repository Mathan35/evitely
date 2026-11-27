<?php

namespace Tests\Feature;

use App\Models\AdminAuditLog;
use App\Models\User;
use App\Services\SiteSettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSiteSettingsTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        config(['platform.admin_emails' => ['owner@example.com']]);

        return User::factory()->create(['email' => 'owner@example.com']);
    }

    public function test_admin_can_open_site_settings(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->get(route('admin.site.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/site/index')
                ->has('social', 3)
                ->where('public_preview', []));
    }

    public function test_admin_can_save_and_toggle_footer_social_links(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->post(route('admin.site.social.update'), [
                'links' => [
                    [
                        'network' => 'instagram',
                        'url' => 'https://instagram.com/invidora',
                        'enabled' => true,
                    ],
                    [
                        'network' => 'facebook',
                        'url' => 'https://facebook.com/invidora',
                        'enabled' => false,
                    ],
                    [
                        'network' => 'linkedin',
                        'url' => 'https://linkedin.com/company/invidora',
                        'enabled' => true,
                    ],
                ],
            ])
            ->assertRedirect();

        $public = app(SiteSettingsService::class)->footerSocialPublic();
        $this->assertCount(2, $public);
        $this->assertSame(['instagram', 'linkedin'], array_column($public, 'network'));

        $this->assertTrue(
            AdminAuditLog::query()->where('action', 'site.footer_social.update')->exists()
        );

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('footerSocial', 2)
                ->where('footerSocial.0.network', 'instagram'));
    }

    public function test_enabled_link_requires_url(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->post(route('admin.site.social.update'), [
                'links' => [
                    ['network' => 'instagram', 'url' => '', 'enabled' => true],
                    ['network' => 'facebook', 'url' => '', 'enabled' => false],
                    ['network' => 'linkedin', 'url' => '', 'enabled' => false],
                ],
            ])
            ->assertSessionHasErrors('links.0.url');
    }

    public function test_non_admin_cannot_manage_site_settings(): void
    {
        config(['platform.admin_emails' => ['owner@example.com']]);
        $user = User::factory()->create(['email' => 'guest@example.com']);

        $this->actingAs($user)
            ->get(route('admin.site.edit'))
            ->assertNotFound();
    }
}
