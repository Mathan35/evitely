<?php

namespace App\Http\Controllers;

use App\Http\Requests\Support\StoreSupportMessageRequest;
use App\Models\SupportMessage;
use App\Notifications\SupportMessageReceived;
use App\Support\MarketingSeo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class SupportController extends Controller
{
    public function show(): Response
    {
        $user = request()->user();

        return Inertia::render('support', [
            'topics' => SupportMessage::TOPICS,
            'prefill' => [
                'name' => $user?->name ?? '',
                'email' => $user?->email ?? '',
            ],
            'faqs' => [
                [
                    'q' => 'How do I create an invitation?',
                    'a' => 'Open My Events, tap Create Invitation, pick a design, then customize your card or guest site. Cards stay free forever; guest websites include a free trial.',
                ],
                [
                    'q' => 'My guests cannot open the link.',
                    'a' => 'Confirm the invitation is published and not paused. If you set a passcode, guests need that code. Try the personal guest link from Guests if you shared one.',
                ],
                [
                    'q' => 'How do billing and site packs work?',
                    'a' => 'Publishing a guest website beyond the trial uses a site pack. Open Billing on the event for plans, renewals, and payment history.',
                ],
                [
                    'q' => 'Can I report a bug with a screenshot?',
                    'a' => 'Yes — describe what happened and include the page URL. Mention the device and browser if you can. We read every report.',
                ],
            ],
            'seo' => MarketingSeo::page(
                'Support · '.config('app.name', 'Invidora'),
                'Get help with Invidora, report a bug, ask about billing, or share feedback. We usually reply within one business day.',
                '/support',
                null,
                [
                    [
                        'q' => 'How do I contact Invidora support?',
                        'a' => 'Use the support form on this page to report bugs, ask for help, or send feedback. We email you back from our support inbox.',
                    ],
                ],
            ),
        ]);
    }

    public function store(StoreSupportMessageRequest $request): RedirectResponse
    {
        // Honeypot hit — pretend success without storing.
        if (filled($request->input('company'))) {
            return redirect()->route('support')->with('support_sent', true);
        }

        $data = $request->safe()->except(['company']);

        $supportMessage = SupportMessage::query()->create([
            ...$data,
            'user_id' => $request->user()?->id,
            'page_url' => $this->normalizePageUrl($data['page_url'] ?? null),
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 512) ?: null,
            'status' => 'new',
        ]);

        $recipients = collect(config('platform.admin_emails', []))
            ->filter()
            ->map(fn ($email) => strtolower(trim((string) $email)))
            ->unique()
            ->values()
            ->all();

        if ($recipients === []) {
            $fallback = (string) config('mail.from.address', '');
            if ($fallback !== '') {
                $recipients = [strtolower($fallback)];
            }
        }

        if ($recipients !== []) {
            Notification::route('mail', $recipients)
                ->notify(new SupportMessageReceived($supportMessage));
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Thanks — your message is on its way. We usually reply within one business day.',
        ]);

        return redirect()->route('support')->with('support_sent', true);
    }

    private function normalizePageUrl(?string $url): ?string
    {
        $url = trim((string) $url);
        if ($url === '') {
            return null;
        }

        if (! str_starts_with($url, 'http://') && ! str_starts_with($url, 'https://') && ! str_starts_with($url, '/')) {
            $url = '/'.$url;
        }

        return mb_substr($url, 0, 500);
    }
}
