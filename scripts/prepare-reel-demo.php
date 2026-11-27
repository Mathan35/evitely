<?php

/**
 * Thin wrapper — prefer: php artisan reel:prepare-demo
 */
passthru(PHP_BINARY.' '.escapeshellarg(__DIR__.'/../artisan').' reel:prepare-demo', $code);
exit($code);
