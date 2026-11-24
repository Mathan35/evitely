<?php

$dir = __DIR__.'/../public/images/gallery/baby-shower/blank';
$keys = [
    'woodland', 'cloudland', 'olive', 'terracotta', 'safari', 'celestial', 'minimal-teddy', 'balloon',
    'eucalyptus', 'stars', 'jungle', 'retro-love', 'picnic', 'giraffe', 'floral-bloom', 'geometric',
    'ocean', 'forest', 'sage', 'watercolor',
];

foreach ($keys as $k) {
    $path = $dir.'/card-'.$k.'-mobile.jpg';
    $im = @imagecreatefromjpeg($path);
    if (! $im) {
        echo "FAIL {$k}\n";

        continue;
    }

    $w = imagesx($im);
    $h = imagesy($im);
    $stepY = max(1, (int) ($h / 90));
    $stepX = max(1, (int) ($w / 50));

    $isBusy = static function (int $c): bool {
        $r = ($c >> 16) & 255;
        $g = ($c >> 8) & 255;
        $b = $c & 255;
        $l = (0.2126 * $r + 0.7152 * $g + 0.0722 * $b) / 255;
        $s = (max($r, $g, $b) - min($r, $g, $b)) / max(1, max($r, $g, $b));

        return $l < 0.80 || $s > 0.16;
    };

    $topBusy = 0;
    for ($y = 0; $y < (int) ($h * 0.42); $y += $stepY) {
        $busy = 0;
        $n = 0;
        for ($x = (int) ($w * 0.22); $x < (int) ($w * 0.78); $x += $stepX) {
            if ($isBusy(imagecolorat($im, $x, $y))) {
                $busy++;
            }
            $n++;
        }
        if ($n && $busy / $n > 0.22) {
            $topBusy = $y;
        }
    }

    $botBusy = 0;
    for ($y = $h - 1; $y > (int) ($h * 0.50); $y -= $stepY) {
        $busy = 0;
        $n = 0;
        for ($x = (int) ($w * 0.22); $x < (int) ($w * 0.78); $x += $stepX) {
            if ($isBusy(imagecolorat($im, $x, $y))) {
                $busy++;
            }
            $n++;
        }
        if ($n && $busy / $n > 0.22) {
            $botBusy = $h - 1 - $y;
        }
    }

    $leftBusy = 0;
    for ($x = 0; $x < (int) ($w * 0.48); $x += $stepX) {
        $busy = 0;
        $n = 0;
        for ($y = (int) ($h * 0.28); $y < (int) ($h * 0.68); $y += $stepY) {
            if ($isBusy(imagecolorat($im, $x, $y))) {
                $busy++;
            }
            $n++;
        }
        if ($n && $busy / $n > 0.20) {
            $leftBusy = $x;
        }
    }

    $rightBusy = 0;
    for ($x = $w - 1; $x > (int) ($w * 0.52); $x -= $stepX) {
        $busy = 0;
        $n = 0;
        for ($y = (int) ($h * 0.28); $y < (int) ($h * 0.68); $y += $stepY) {
            if ($isBusy(imagecolorat($im, $x, $y))) {
                $busy++;
            }
            $n++;
        }
        if ($n && $busy / $n > 0.20) {
            $rightBusy = $w - 1 - $x;
        }
    }

    $t = min(42, max(12, round($topBusy / $h * 100) + 5));
    $b = min(46, max(18, round($botBusy / $h * 100) + 5));
    $l = min(48, max(10, round($leftBusy / $w * 100) + 4));
    $r = min(42, max(10, round($rightBusy / $w * 100) + 4));

    echo sprintf("%s => [%d, %d, %d, %d]\n", $k, $t, $r, $b, $l);
    imagedestroy($im);
}
