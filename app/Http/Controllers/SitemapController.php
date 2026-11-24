<?php

namespace App\Http\Controllers;

use App\Support\MarketingSeo;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $urls = MarketingSeo::sitemapEntries();

        $body = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
        $body .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";

        foreach ($urls as $entry) {
            $loc = htmlspecialchars((string) $entry['loc'], ENT_XML1 | ENT_QUOTES, 'UTF-8');
            $changefreq = htmlspecialchars((string) $entry['changefreq'], ENT_XML1 | ENT_QUOTES, 'UTF-8');
            $priority = htmlspecialchars((string) $entry['priority'], ENT_XML1 | ENT_QUOTES, 'UTF-8');

            $body .= "  <url>\n";
            $body .= "    <loc>{$loc}</loc>\n";
            $body .= "    <changefreq>{$changefreq}</changefreq>\n";
            $body .= "    <priority>{$priority}</priority>\n";
            $body .= "  </url>\n";
        }

        $body .= '</urlset>';

        return response($body, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
