<?php

declare(strict_types=1);

/**
 * Prefer the Node rasterizer (exact website favicon.svg → PNG):
 *   node scripts/rasterize-pwa-icons.mjs
 *
 * This PHP fallback only runs when Node/@resvg is unavailable.
 */

$root = dirname(__DIR__);
$mjs = $root.DIRECTORY_SEPARATOR.'scripts'.DIRECTORY_SEPARATOR.'rasterize-pwa-icons.mjs';

$node = trim((string) shell_exec('node -v 2>&1'));
if ($node !== '' && is_file($mjs)) {
    $cmd = 'node '.escapeshellarg($mjs);
    passthru($cmd, $code);
    if ($code === 0) {
        require __DIR__.'/sync-brand-jpg.php';
        exit(0);
    }
}

fwrite(STDERR, "Node rasterizer unavailable — install @resvg/resvg-js and run:\n  node scripts/rasterize-pwa-icons.mjs\n");
exit(1);
