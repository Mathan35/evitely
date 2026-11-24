<?php

declare(strict_types=1);

$dir = dirname(__DIR__).'/public/icons';
if (! is_dir($dir)) {
    mkdir($dir, 0777, true);
}

$draw = function (int $size, string $path): void {
    $im = imagecreatetruecolor($size, $size);
    imagesavealpha($im, true);
    $bg = imagecolorallocate($im, 44, 38, 31);
    imagefilledrectangle($im, 0, 0, $size - 1, $size - 1, $bg);
    $fg = imagecolorallocate($im, 243, 238, 228);
    $cx1 = (int) ($size * 0.40);
    $cy = (int) ($size * 0.50);
    $r = (int) ($size * 0.22);
    $cx2 = (int) ($size * 0.60);
    imagefilledellipse($im, $cx1, $cy, $r * 2, $r * 2, $fg);
    imagefilledellipse($im, $cx2, $cy, $r * 2, $r * 2, $fg);
    $hole = imagecolorallocate($im, 44, 38, 31);
    $hr = (int) ($r * 0.55);
    imagefilledellipse($im, $cx1, $cy, $hr * 2, $hr * 2, $hole);
    imagefilledellipse($im, $cx2, $cy, $hr * 2, $hr * 2, $hole);
    imagepng($im, $path);
    imagedestroy($im);
};

$draw(192, $dir.'/icon-192.png');
$draw(512, $dir.'/icon-512.png');
$draw(512, $dir.'/icon-maskable-512.png');

echo "Generated icons in {$dir}\n";
