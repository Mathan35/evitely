<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminAuditLogger;
use App\Services\SiteSettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SiteSettingsController extends Controller
{
    public function edit(SiteSettingsService $settings): Response
    {
        return Inertia::render('admin/site/index', [
            'social' => array_values($settings->footerSocialAdmin()),
            'public_preview' => $settings->footerSocialPublic(),
        ]);
    }

    public function updateSocial(
        Request $request,
        SiteSettingsService $settings,
        AdminAuditLogger $audit,
    ): RedirectResponse {
        $data = $request->validate([
            'links' => ['required', 'array', 'min:1'],
            'links.*.network' => ['required', 'string', Rule::in($settings->socialNetworks())],
            'links.*.url' => ['nullable', 'string', 'max:500'],
            'links.*.enabled' => ['sometimes', 'boolean'],
        ]);

        foreach ($data['links'] as $index => $link) {
            $url = trim((string) ($link['url'] ?? ''));
            $enabled = (bool) ($link['enabled'] ?? false);
            if ($enabled && $url === '') {
                return back()->withErrors([
                    "links.{$index}.url" => 'Add a URL before enabling this network.',
                ]);
            }
            if ($url !== '' && filter_var(
                preg_match('#^https?://#i', $url) ? $url : 'https://'.$url,
                FILTER_VALIDATE_URL,
            ) === false) {
                return back()->withErrors([
                    "links.{$index}.url" => 'Enter a valid URL (https://…).',
                ]);
            }
        }

        $saved = $settings->saveFooterSocial($data['links'], $request->user());
        $audit->log($request->user(), 'site.footer_social.update', null, [
            'links' => $saved,
        ], $request);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Footer social links saved.',
        ]);
    }
}
