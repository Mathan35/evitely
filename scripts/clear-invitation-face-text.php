<?php

/**
 * Clear baked invitation letters from wedding/housewarming face photos
 * while keeping border artwork (florals, cottage, ornament).
 */
$roots = [
    'wedding' => __DIR__.'/../public/images/gallery/wedding',
    'housewarming' => __DIR__.'/../public/images/gallery/housewarming',
];

foreach ($roots as $kind => $dir) {
    $backup = $dir.'/faces-source';

    if (! is_dir($backup)) {
        mkdir($backup, 0777, true);
    }

    $files = glob($dir.'/card-*-mobile.jpg') ?: [];

    foreach ($files as $file) {
        $source = $backup.'/'.basename($file);

        if (! is_file($source)) {
            copy($file, $source);
        }

        clearFace($source, $file, $kind);
        echo basename($file)."\n";
    }
}

function lum(int $r, int $g, int $b): float
{
    return (0.2126 * $r + 0.7152 * $g + 0.0722 * $b) / 255;
}

function sat(int $r, int $g, int $b): float
{
    $max = max($r, $g, $b);
    $min = min($r, $g, $b);

    return $max === 0 ? 0.0 : ($max - $min) / $max;
}

function clearFace(string $source, string $path, string $kind): void
{
    $im = imagecreatefromjpeg($source);

    if (! $im) {
        return;
    }

    $w = imagesx($im);
    $h = imagesy($im);
    $cx = $w / 2;
    $cy = $kind === 'housewarming' ? $h * 0.58 : $h * 0.48;
    $rx = $w * ($kind === 'housewarming' ? 0.27 : 0.29);
    $ry = $h * ($kind === 'housewarming' ? 0.22 : 0.31);

    $samples = [];
    $stepX = max(1, (int) round($w / 80));
    $stepY = max(1, (int) round($h / 100));

    for ($y = (int) ($cy - $ry * 0.55); $y <= (int) ($cy + $ry * 0.55); $y += $stepY) {
        for ($x = (int) ($cx - $rx * 0.55); $x <= (int) ($cx + $rx * 0.55); $x += $stepX) {
            if ($x < 0 || $y < 0 || $x >= $w || $y >= $h) {
                continue;
            }

            $rgb = imagecolorat($im, $x, $y);
            $r = ($rgb >> 16) & 255;
            $g = ($rgb >> 8) & 255;
            $b = $rgb & 255;
            $l = lum($r, $g, $b);

            if ($l < 0.08 || $l > 0.97 || sat($r, $g, $b) > 0.34) {
                continue;
            }

            $samples[] = ['r' => $r, 'g' => $g, 'b' => $b, 'l' => $l];
        }
    }

    if ($samples === []) {
        imagedestroy($im);

        return;
    }

    usort($samples, fn ($a, $b) => $a['l'] <=> $b['l']);
    $avgL = array_sum(array_column($samples, 'l')) / count($samples);
    $pool = $avgL >= 0.45
        ? array_slice($samples, (int) floor(count($samples) * 0.62))
        : array_slice($samples, (int) floor(count($samples) * 0.12), max(8, (int) floor(count($samples) * 0.3)));
    $n = max(1, count($pool));
    $paperR = (int) round(array_sum(array_column($pool, 'r')) / $n);
    $paperG = (int) round(array_sum(array_column($pool, 'g')) / $n);
    $paperB = (int) round(array_sum(array_column($pool, 'b')) / $n);
    $paperL = lum($paperR, $paperG, $paperB);
    $dark = $paperL < 0.45;
    $paper = imagecolorallocate($im, $paperR, $paperG, $paperB);

    $topTitle = false;

    if ($kind === 'housewarming') {
        $var = 0;
        $count = 0;
        $mean = 0;
        $vals = [];

        for ($y = (int) ($h * 0.08); $y <= (int) ($h * 0.30); $y += $stepY) {
            for ($x = (int) ($w * 0.34); $x <= (int) ($w * 0.66); $x += $stepX) {
                $rgb = imagecolorat($im, $x, $y);
                $l = lum(($rgb >> 16) & 255, ($rgb >> 8) & 255, $rgb & 255);
                $vals[] = $l;
                $mean += $l;
                $count++;
            }
        }

        if ($count > 0) {
            $mean /= $count;
            foreach ($vals as $l) {
                $var += ($l - $mean) ** 2;
            }
            $topTitle = sqrt($var / $count) < 0.16;
        }
    }

    $mark = [];

    for ($y = 0; $y < $h; $y++) {
        for ($x = 0; $x < $w; $x++) {
            $nx = ($x - $cx) / $rx;
            $ny = ($y - $cy) / $ry;
            $inWell = ($nx * $nx + $ny * $ny) <= 1.0;
            $inTitle = false;

            if ($topTitle) {
                $tx = ($x - $cx) / ($w * 0.30);
                $ty = ($y - $h * 0.20) / ($h * 0.10);
                $inTitle = ($tx * $tx + $ty * $ty) <= 1.0;
            }

            if (! $inWell && ! $inTitle) {
                continue;
            }

            $rgb = imagecolorat($im, $x, $y);
            $r = ($rgb >> 16) & 255;
            $g = ($rgb >> 8) & 255;
            $b = $rgb & 255;
            $l = lum($r, $g, $b);
            $s = sat($r, $g, $b);
            $isGold = $r > 120 && $r > $g && $g > $b && ($r - $b) > 28 && $s < 0.62;
            $isFloral = $s > 0.30 && ! $isGold && (abs($g - $r) > 18 || $g > $r + 12);

            if ($isFloral) {
                continue;
            }

            $ink = $dark
                ? ($l > $paperL + 0.10)
                : ($l < $paperL - 0.09 || ($isGold && $l < 0.82));

            if ($ink) {
                $mark[$y][$x] = true;
            }
        }
    }

    foreach ($mark as $y => $row) {
        foreach ($row as $x => $_) {
            imagesetpixel($im, $x, $y, $paper);

            for ($oy = -1; $oy <= 1; $oy++) {
                for ($ox = -1; $ox <= 1; $ox++) {
                    $nx = $x + $ox;
                    $ny = $y + $oy;

                    if ($nx < 0 || $ny < 0 || $nx >= $w || $ny >= $h || isset($mark[$ny][$nx])) {
                        continue;
                    }

                    $rgb = imagecolorat($im, $nx, $ny);
                    $r = ($rgb >> 16) & 255;
                    $g = ($rgb >> 8) & 255;
                    $b = $rgb & 255;
                    $blend = imagecolorallocate(
                        $im,
                        (int) round(($r + $paperR) / 2),
                        (int) round(($g + $paperG) / 2),
                        (int) round(($b + $paperB) / 2),
                    );
                    imagesetpixel($im, $nx, $ny, $blend);
                }
            }
        }
    }

    imagejpeg($im, $path, 92);
    imagedestroy($im);
}
