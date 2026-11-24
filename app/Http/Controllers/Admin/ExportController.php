<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BillingPayment;
use App\Models\User;
use App\Models\Wedding;
use App\Models\WeddingGuest;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function users(Request $request): StreamedResponse
    {
        $q = trim((string) $request->query('q', ''));
        $plan = trim((string) $request->query('plan', ''));

        return $this->csv('users.csv', ['id', 'name', 'email', 'plan', 'message_credits', 'plan_ends_at', 'disabled_at', 'created_at'], function ($out) use ($q, $plan): void {
            User::query()
                ->when($q !== '', function ($query) use ($q): void {
                    $query->where(function ($inner) use ($q): void {
                        $inner->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%");
                    });
                })
                ->when(in_array($plan, ['free', 'pro'], true), fn ($query) => $query->where('plan', $plan))
                ->orderBy('id')
                ->chunk(200, function ($rows) use ($out): void {
                    foreach ($rows as $user) {
                        fputcsv($out, [
                            $user->id,
                            $user->name,
                            $user->email,
                            $user->plan,
                            $user->message_credits,
                            $user->plan_ends_at?->toDateTimeString(),
                            $user->disabled_at?->toDateTimeString(),
                            $user->created_at?->toDateTimeString(),
                        ]);
                    }
                });
        });
    }

    public function events(Request $request): StreamedResponse
    {
        $q = trim((string) $request->query('q', ''));

        return $this->csv('events.csv', ['id', 'title', 'slug', 'status', 'site_billing_status', 'owner_email', 'starts_on', 'created_at'], function ($out) use ($q): void {
            Wedding::query()
                ->with('user:id,email')
                ->when($q !== '', function ($query) use ($q): void {
                    $query->where(function ($inner) use ($q): void {
                        $inner->where('title', 'like', "%{$q}%")
                            ->orWhere('slug', 'like', "%{$q}%")
                            ->orWhereHas('user', fn ($u) => $u->where('email', 'like', "%{$q}%"));
                    });
                })
                ->orderBy('id')
                ->chunk(200, function ($rows) use ($out): void {
                    foreach ($rows as $wedding) {
                        fputcsv($out, [
                            $wedding->id,
                            $wedding->displayTitle(),
                            $wedding->slug,
                            $wedding->status?->value ?? (string) $wedding->status,
                            $wedding->site_billing_status,
                            $wedding->user?->email,
                            $wedding->starts_on?->toDateString(),
                            $wedding->created_at?->toDateTimeString(),
                        ]);
                    }
                });
        });
    }

    public function payments(Request $request): StreamedResponse
    {
        $status = trim((string) $request->query('status', ''));

        return $this->csv('payments.csv', ['id', 'user_email', 'event_id', 'provider', 'kind', 'sku', 'status', 'amount_paise', 'currency', 'paid_at'], function ($out) use ($status): void {
            BillingPayment::query()
                ->with('user:id,email')
                ->when($status !== '', fn ($query) => $query->where('status', $status))
                ->orderBy('id')
                ->chunk(200, function ($rows) use ($out): void {
                    foreach ($rows as $payment) {
                        fputcsv($out, [
                            $payment->id,
                            $payment->user?->email,
                            $payment->event_id,
                            $payment->provider,
                            $payment->kind,
                            $payment->sku,
                            $payment->status,
                            $payment->amount_paise,
                            $payment->currency,
                            $payment->paid_at?->toDateTimeString(),
                        ]);
                    }
                });
        });
    }

    public function guests(Request $request): StreamedResponse
    {
        $q = trim((string) $request->query('q', ''));

        return $this->csv('guests.csv', ['id', 'event_id', 'name', 'email', 'phone', 'rsvp_status', 'invitation_status'], function ($out) use ($q): void {
            WeddingGuest::query()
                ->when($q !== '', function ($query) use ($q): void {
                    $query->where(function ($inner) use ($q): void {
                        $inner->where('email', 'like', "%{$q}%")
                            ->orWhere('phone', 'like', "%{$q}%")
                            ->orWhere('first_name', 'like', "%{$q}%")
                            ->orWhere('last_name', 'like', "%{$q}%");
                    });
                })
                ->orderBy('id')
                ->chunk(200, function ($rows) use ($out): void {
                    foreach ($rows as $guest) {
                        fputcsv($out, [
                            $guest->id,
                            $guest->event_id,
                            $guest->fullName(),
                            $guest->email,
                            $guest->phone,
                            $guest->rsvp_status?->value ?? (string) $guest->rsvp_status,
                            $guest->invitation_status?->value ?? (string) $guest->invitation_status,
                        ]);
                    }
                });
        });
    }

    /**
     * @param  list<string>  $headers
     * @param  callable(resource): void  $writer
     */
    private function csv(string $filename, array $headers, callable $writer): StreamedResponse
    {
        return response()->streamDownload(function () use ($headers, $writer): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            $writer($out);
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
