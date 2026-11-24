<?php

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
    $im = imagecreatefromjpeg($path);

    if (! $im) {
        fwrite(STDERR, "FAIL open {$key}\n");

        continue;
    }

    $w = imagesx($im);
    $h = imagesy($im);
    $sw = max(90, (int) round($w / 7));
    $sh = max(140, (int) round($h / 7));
    $tmp = imagecreatetruecolor($sw, $sh);
    imagecopyresampled($tmp, $im, 0, 0, 0, 0, $sw, $sh, $w, $h);

    $busy = array_fill(0, $sh, array_fill(0, $sw, 0));

    for ($y = 1; $y < $sh - 1; $y++) {
        for ($x = 1; $x < $sw - 1; $x++) {
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
                    $c = imagecolorat($tmp, $x + $dx, $y + $dy);
                    $lr = ($c >> 16) & 255;
                    $lg = ($c >> 8) & 255;
                    $lb = $c & 255;
                    $var += abs(lum($lr, $lg, $lb) - $l);
                    $n++;
                }
            }

            $var /= max(1, $n);
            $busy[$y][$x] = ($var > 0.042 || $s > 0.36) ? 1 : 0;
        }
    }

    $best = null;
    $bestArea = 0;

    for ($top = (int) ($sh * 0.04); $top < (int) ($sh * 0.42); $top += 1) {
        for ($bottom = $sh - 1 - (int) ($sh * 0.04); $bottom > (int) ($sh * 0.58); $bottom -= 1) {
            if ($bottom - $top < (int) ($sh * 0.28)) {
                continue;
            }

            for ($left = (int) ($sw * 0.04); $left < (int) ($sw * 0.38); $left += 1) {
                for ($right = $sw - 1 - (int) ($sw * 0.04); $right > (int) ($sw * 0.62); $right -= 1) {
                    if ($right - $left < (int) ($sw * 0.32)) {
                        continue;
                    }

                    $area = ($right - $left) * ($bottom - $top);

                    if ($area <= $bestArea) {
                        continue;
                    }

                    $ok = true;
                    $busyCount = 0;
                    $cells = 0;

                    for ($y = $top; $y <= $bottom && $ok; $y += 2) {
                        for ($x = $left; $x <= $right; $x += 2) {
                            $cells++;

                            if (! empty($busy[$y][$x])) {
                                $busyCount++;

                                if ($busyCount / max(1, $cells) > 0.055) {
                                    $ok = false;
                                    break;
                                }
                            }
                        }
                    }

                    if ($ok) {
                        $bestArea = $area;
                        $best = [$left, $top, $right, $bottom];
                    }
                }
            }
        }
    }

    imagedestroy($tmp);
    imagedestroy($im);

    if (! $best) {
        // Busy border arts: fall back to a conservative blank-center box.
        $out[$key] = [22.0, 18.0, 34.0, 18.0];
        echo "{$key} => fallback [22, 18, 34, 18]\n";

        continue;
    }

    [$l, $t, $r, $b] = $best;
    $padX = max(2, (int) round(($r - $l) * 0.05));
    $padY = max(2, (int) round(($b - $t) * 0.05));
    $l += $padX;
    $r -= $padX;
    $t += $padY;
    $b -= $padY;

    $topPct = round(($t / $sh) * 100, 1);
    $rightPct = round((($sw - 1 - $r) / $sw) * 100, 1);
    $bottomPct = round((($sh - 1 - $b) / $sh) * 100, 1);
    $leftPct = round(($l / $sw) * 100, 1);

    $topPct = max(12, min(30, $topPct));
    $bottomPct = max(18, min(40, $bottomPct));
    $leftPct = max(10, min(28, $leftPct));
    $rightPct = max(10, min(28, $rightPct));

    $out[$key] = [$topPct, $rightPct, $bottomPct, $leftPct];
    echo "{$key} => [{$topPct}, {$rightPct}, {$bottomPct}, {$leftPct}]\n";
}

file_put_contents(__DIR__.'/baby-shower-safe-zones.json', json_encode($out, JSON_PRETTY_PRINT));
echo "wrote scripts/baby-shower-safe-zones.json\n";
