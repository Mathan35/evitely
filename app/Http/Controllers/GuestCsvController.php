<?php

namespace App\Http\Controllers;

use App\Models\Wedding;
use App\Services\GuestCsvService;
use App\Services\GuestInvitationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class GuestCsvController extends Controller
{
    public function exportGuests(Wedding $wedding, GuestCsvService $csv): StreamedResponse
    {
        Gate::authorize('view', $wedding);

        $filename = 'guests-'.$wedding->slug.'-'.now()->format('Ymd').'.csv';

        return $this->streamCsv($filename, function ($out) use ($wedding, $csv): void {
            fputcsv($out, $csv->guestHeaders());
            foreach ($csv->guestRows($wedding) as $row) {
                fputcsv($out, $row);
            }
        });
    }

    public function exportRsvps(Wedding $wedding, GuestCsvService $csv): StreamedResponse
    {
        Gate::authorize('view', $wedding);

        $filename = 'rsvps-'.$wedding->slug.'-'.now()->format('Ymd').'.csv';

        return $this->streamCsv($filename, function ($out) use ($wedding, $csv): void {
            fputcsv($out, $csv->rsvpHeaders());
            foreach ($csv->rsvpRows($wedding) as $row) {
                fputcsv($out, $row);
            }
        });
    }

    public function exportCatering(Wedding $wedding, GuestCsvService $csv): StreamedResponse
    {
        Gate::authorize('view', $wedding);

        $filename = 'catering-'.$wedding->slug.'-'.now()->format('Ymd').'.csv';

        return $this->streamCsv($filename, function ($out) use ($wedding, $csv): void {
            fputcsv($out, $csv->cateringHeaders());
            foreach ($csv->cateringRows($wedding) as $row) {
                fputcsv($out, $row);
            }
        });
    }

    public function sample(Wedding $wedding, GuestCsvService $csv): StreamedResponse
    {
        Gate::authorize('update', $wedding);

        return $this->streamCsv('guest-import-sample.csv', function ($out) use ($csv): void {
            // UTF-8 BOM so Excel opens accents correctly.
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $csv->importHeaders());
            foreach ($csv->sampleRows() as $row) {
                fputcsv($out, $row);
            }
        });
    }

    public function import(
        Request $request,
        Wedding $wedding,
        GuestCsvService $csv,
        GuestInvitationService $guests,
        \App\Services\Billing\BillingService $billing,
    ): RedirectResponse {
        Gate::authorize('update', $wedding);

        $request->validate([
            'file' => [
                'required',
                File::types(['csv', 'txt'])
                    ->max(2048),
            ],
        ], [
            'file.required' => 'Choose a CSV spreadsheet to import.',
            'file' => 'Upload a .csv file (save your Excel sheet as CSV UTF-8). Max 2 MB.',
        ]);

        $capacity = $billing->guestCapacity($request->user(), $wedding);
        $result = $csv->import(
            $wedding,
            $request->file('file'),
            $guests,
            $capacity['remaining'],
        );

        if ($result['created'] === 0) {
            $message = $result['errors'][0] ?? 'No guests imported.';
            if (count($result['errors']) > 1) {
                $message .= ' (+'.(count($result['errors']) - 1).' more issues)';
            }

            Inertia::flash('toast', [
                'type' => 'error',
                'message' => $message,
            ]);

            return back()->withErrors([
                'file' => implode(' · ', array_slice($result['errors'], 0, 5)),
            ]);
        }

        $parts = ["Imported {$result['created']} guest".($result['created'] === 1 ? '' : 's')];
        if ($result['skipped'] > 0) {
            $parts[] = "{$result['skipped']} skipped";
        }
        if ($result['errors'] !== []) {
            $parts[] = count($result['errors']).' warning'.(count($result['errors']) === 1 ? '' : 's');
        }

        Inertia::flash('toast', [
            'type' => $result['skipped'] > 0 ? 'success' : 'success',
            'message' => implode(' · ', $parts).'.',
        ]);

        return back();
    }

    /**
     * @param  callable(resource): void  $writer
     */
    private function streamCsv(string $filename, callable $writer): StreamedResponse
    {
        return response()->streamDownload(function () use ($writer): void {
            $out = fopen('php://output', 'wb');
            $writer($out);
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
