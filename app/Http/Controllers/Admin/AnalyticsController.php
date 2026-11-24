<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\PlatformAnalyticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AnalyticsController extends Controller
{
    public function index(Request $request, PlatformAnalyticsService $analytics): Response
    {
        $preset = (string) $request->query('preset', '30d');
        $from = $request->query('from');
        $to = $request->query('to');

        return Inertia::render('admin/analytics/index', [
            'analytics' => $analytics->full(
                is_string($from) ? $from : null,
                is_string($to) ? $to : null,
                $preset,
            ),
            'filters' => [
                'preset' => $preset,
                'from' => is_string($from) ? $from : null,
                'to' => is_string($to) ? $to : null,
            ],
        ]);
    }

    public function export(Request $request, PlatformAnalyticsService $analytics): StreamedResponse
    {
        $preset = (string) $request->query('preset', '30d');
        $from = $request->query('from');
        $to = $request->query('to');
        $data = $analytics->full(
            is_string($from) ? $from : null,
            is_string($to) ? $to : null,
            $preset,
        );

        $filename = 'platform-analytics-'.$data['range']['from'].'_'.$data['range']['to'].'.csv';

        return response()->streamDownload(function () use ($data): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['section', 'key', 'value']);
            foreach ($data['kpis'] as $key => $value) {
                fputcsv($out, ['kpi', $key, $value]);
            }
            fputcsv($out, []);
            fputcsv($out, ['date', 'signups', 'events_created', 'events_published', 'views', 'unique_views', 'guest_views', 'revenue_paise']);
            $growth = collect($data['series']['growth'])->keyBy('date');
            $traffic = collect($data['series']['traffic'])->keyBy('date');
            $revenue = collect($data['series']['revenue'])->keyBy('date');
            foreach ($growth->keys() as $date) {
                fputcsv($out, [
                    $date,
                    $growth[$date]['signups'] ?? 0,
                    $growth[$date]['events_created'] ?? 0,
                    $growth[$date]['events_published'] ?? 0,
                    $traffic[$date]['views'] ?? 0,
                    $traffic[$date]['unique_views'] ?? 0,
                    $traffic[$date]['guest_views'] ?? 0,
                    $revenue[$date]['revenue_paise'] ?? 0,
                ]);
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
