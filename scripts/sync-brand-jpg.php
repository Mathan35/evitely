<?php

declare(strict_types=1);

$png = dirname(__DIR__).'/public/brand/invidora-mark.png';
$jpg = dirname(__DIR__).'/public/brand/invidora-mark.jpg';

$src = imagecreatefrompng($png);
if ($src === false) {
    fwrite(STDERR, "Failed to read {$png}\n");
    exit(1);
}

$w = imagesx($src);
$h = imagesy($src);
$out = imagecreatetruecolor($w, $h);
imagecopy($out, $src, 0, 0, 0, 0, $w, $h);
imagejpeg($out, $jpg, 92);
imagedestroy($src);
imagedestroy($out);

echo "Synced {$jpg}\n";
