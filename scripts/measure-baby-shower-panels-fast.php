<?php

/**
 * Fast blank-panel detector for baby-shower card arts.
 * Scans a downscaled grid, finds largest low-busy rectangle, emits inset %.
 */
$dir = __DIR__.'/../public/images/gallery/baby-shower/blank';
$keys = [
    'woodland', 'cloudland', 'olive', 'terracotta', 'safari', 'celestial', 'minimal-teddy', 'balloon',
    'eucalyptus', 'stars', 'jungle', 'retro-love', 'picnic', 'giraffe', 'floral-bloom', 'geometric',
    'ocean', 'forest', 'sage', 'watercolor',
];

function lum(int $r, int $g, int $b): float
{
    return (0.2126 * $r + 0.7152 * $g + 0.0722 * $b) / 255;
}

function sat(int $r, int $g, int $b): float
{
    $mx = max($r, $g, $b);
    $mn = min($r, $g, $b);

    return $mx === 0 ? 0.0 : ($mx - $mn) / $mx;
}

$out = [];

foreach ($keys as $key) {
    $path = $dir.'/card-'.$key.'-mobile.jpg';
    $im = @imagecreatefromjpeg($path);
    if (! $im) {
        fwrite(STDERR, "FAIL {$key}\n");

        continue;
    }

    $w = imagesx($im);
    $h = imagesy($im);
    $sw = 48;
    $sh = (int) max(72, round(48 * $h / $w));
    $tmp = imagecreatetruecolor($sw, $sh);
    imagecopyresampled($tmp, $im, 0, 0, 0, 0, $sw, $sh, $w, $h);

    $busy = [];
    for ($y = 0; $y < $sh; $y++) {
        for ($x = 0; $x < $sw; $x++) {
            $rgb = imagecolorat($tmp, $x, $y);
            $r = ($rgb >> 16) & 255;
            $g = ($rgb >> 8) & 255;
            $b = $rgb & 255;
            $l = lum($r, $g, $b);
            $s = sat($r, $g, $b);
            $var = 0.0;
            $n = 0;
            for ($dy = -1; $dy <= 1; $dy++) {
                for ($dx = -1; $dx <= 1; $dx++) {
                    $xx = min($sw - 1, max(0, $x + $dx));
                    $yy = min($sh - 1, max(0, $y + $dy));
                    $c = imagecolorat($tmp, $xx, $yy);
                    $var += abs(lum(($c >> 16) & 255, ($c >> 8) & 255, $c & 255) - $l);
                    $n++;
                }
            }
            $var /= max(1, $n);
            $busy[$y][$x] = ($var > 0.026 || $s > 0.26 || $l < 0.14 || $l > 0.98) ? 1 : 0;
        }
    }

    // Prefix sums for O(1) busy queries.
    $ps = array_fill(0, $sh + 1, array_fill(0, $sw + 1, 0));
    for ($y = 1; $y <= $sh; $y++) {
        for ($x = 1; $x <= $sw; $x++) {
            $ps[$y][$x] = $busy[$y - 1][$x - 1]
                + $ps[$y - 1][$x]
                + $ps[$y][$x - 1]
                - $ps[$y - 1][$x - 1];
        }
    }

    $rectBusy = static function (int $l, int $t, int $r, int $b) use ($ps): int {
        // inclusive pixel coords in image space
        $l++;
        $t++;
        $r++;
        $b++;

        return $ps[$b][$r] - $ps[$t - 1][$r] - $ps[$b][$l - 1] + $ps[$t - 1][$l - 1];
    };

    $best = null;
    $bestScore = -1.0;

    for ($top = (int) ($sh * 0.05); $top < (int) ($sh * 0.42); $top += 1) {
        for ($bottom = $sh - 1 - (int) ($sh * 0.08); $bottom > (int) ($sh * 0.52); $bottom -= 1) {
            $hh = $bottom - $top + 1;
            if ($hh < (int) ($sh * 0.24)) {
                continue;
            }
            for ($left = (int) ($sw * 0.04); $left < (int) ($sw * 0.52); $left += 1) {
                for ($right = $sw - 1 - (int) ($sw * 0.04); $right > (int) ($sw * 0.42); $right -= 1) {
                    $ww = $right - $left + 1;
                    if ($ww < (int) ($sw * 0.30)) {
                        continue;
                    }

                    $cells = $ww * $hh;
                    $busyCount = $rectBusy($left, $top, $right, $bottom);
                    $ratio = $busyCount / max(1, $cells);
                    if ($ratio > 0.07) {
                        continue;
                    }

                    $area = $ww * $hh;
                    $cy = ($top + $bottom) / 2 / $sh;
                    $centerBias = 1.0 - abs($cy - 0.44) * 0.4;
                    $score = $area * (1.0 - $ratio * 4.0) * $centerBias;

                    if ($score > $bestScore) {
                        $bestScore = $score;
                        $best = [$left, $top, $right, $bottom, $ratio];
                    }
                }
            }
        }
    }

    imagedestroy($tmp);
    imagedestroy($im);

    if (! $best) {
        $out[$key] = [22, 16, 30, 16];
        echo "{$key}: FALLBACK\n";

        continue;
    }

    [$l, $t, $r, $b] = $best;
    // Extra pad so copy never sits on paws / frame edges.
    $padX = max(2, (int) round(($r - $l) * 0.08));
    $padY = max(2, (int) round(($b - $t) * 0.08));
    $l += $padX;
    $r -= $padX;
    $t += $padY;
    $b -= $padY;

    $topPct = round(($t / $sh) * 100, 1);
    $rightPct = round((($sw - 1 - $r) / $sw) * 100, 1);
    $bottomPct = round((($sh - 1 - $b) / $sh) * 100, 1);
    $leftPct = round(($l / $sw) * 100, 1);

    $topPct = max(10, min(38, $topPct));
    $bottomPct = max(14, min(44, $bottomPct));
    $leftPct = max(8, min(50, $leftPct));
    $rightPct = max(8, min(42, $rightPct));

    $out[$key] = [$topPct, $rightPct, $bottomPct, $leftPct];
    echo sprintf(
        "%s => [%.1f, %.1f, %.1f, %.1f] busy=%.1f%%\n",
        $key,
        $topPct,
        $rightPct,
        $bottomPct,
        $leftPct,
        ($best[4] ?? 0) * 100
    );
}

file_put_contents(__DIR__.'/baby-shower-panels.json', json_encode($out, JSON_PRETTY_PRINT));
echo "wrote scripts/baby-shower-panels.json\n";
