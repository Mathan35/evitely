<?php

/**
 * Install the 20 provided bridal-shower blank-center arts into public gallery blank/.
 */
$assets = 'C:/Users/Abcom/.cursor/projects/c-Users-Abcom-Sites-wedding-invitation/assets';
$dest = __DIR__.'/../public/images/gallery/bridal-shower/blank';

$keys = [
    'blush-filigree',
    'gold-crystal-oval',
    'pink-oval-rose',
    'pearl-vine',
    'emboss-gold-panel',
    'cream-oval-sculpt',
    'ivory-capsule',
    'anime-bride',
    'tulip-bride',
    'pearl-couple',
    'pearl-gold-frame',
    'veil-roses',
    'pajama-blush',
    'pearl-bow',
    'ribbon-right',
    'cream-panel',
    'left-ribbon',
    'rose-pearl',
    'pajama-burgundy',
    'marble-ribbon',
];

$sources = [
    'download__29_-d13a60a7-7464-468b-aea9-53a015e5daf0.jpg',
    'download__27_-a6229e83-a512-4761-98c2-854a69c313ca.jpg',
    'download__28_-142d08d0-675e-44e7-afa8-44352ce81a81.jpg',
    'download__23_-1491f38a-a22e-4556-bf4c-8c4aa0ca2107.jpg',
    'download__26_-4a5c4f2e-141e-4381-9dd2-b82245522156.jpg',
    'download__25_-b80b98ae-87a1-4309-a654-aeb81c5b9aab.jpg',
    'download__24_-7b740ca4-c07a-4bd4-8ed7-8acaa2fb5f88.jpg',
    'download__20_-90238a45-974f-4a48-9d99-f69f5b0cf494.jpg',
    'download__19_-8608dbe1-e4b3-4bce-8084-39a35c7f4f61.jpg',
    'Thank_you_for_coming_-745488f8-b9a6-4d6d-b07c-c32a51dbe4a9.jpg',
    'download__22_-e074f595-0edd-47df-a89f-4e447f3fcb51.jpg',
    'download__21_-4db6c381-b8e8-4547-aef1-ec903a7a521c.jpg',
    'download__18_-1fe5d80d-80e5-42da-857b-2a983829dadd.jpg',
    'Bridal_Shower_Card_Modern_Printable_Template-93f3e13d-c555-4b27-87b6-b46fdd9420bb.jpg',
    'Bridal_Shower_Card_Gallery_Printable_Template-de183a76-189f-4db6-8f4d-28891d2a072e.jpg',
    'download__16_-24f6f871-58d1-421a-88fd-dd4b08ea433f.jpg',
    'download__14_-468c4c97-baa2-42ad-a3be-402981df8561.jpg',
    'download__15_-c8be2b7f-d20d-41a2-90f2-1608dbd87b8c.jpg',
    'download__17_-d45dd467-c782-4e9c-acc6-e32d42a1f63d.jpg',
    '____________________-c01ddbcf-9848-4525-b3ff-425ac25483c4.jpg',
];

if (! is_dir($dest) && ! mkdir($dest, 0775, true) && ! is_dir($dest)) {
    fwrite(STDERR, "Unable to create {$dest}\n");
    exit(1);
}

if (count($keys) !== count($sources)) {
    fwrite(STDERR, 'Key/source count mismatch: '.count($keys).' vs '.count($sources)."\n");
    exit(1);
}

foreach ($keys as $i => $key) {
    $src = $assets.'/'.$sources[$i];

    if (! is_file($src)) {
        fwrite(STDERR, "Missing source: {$src}\n");
        exit(1);
    }

    foreach (['', '-mobile', '-desktop'] as $suffix) {
        $target = $dest.'/card-'.$key.$suffix.'.jpg';
        if (! copy($src, $target)) {
            fwrite(STDERR, "Failed copy to {$target}\n");
            exit(1);
        }
    }

    $dims = getimagesize($dest.'/card-'.$key.'-mobile.jpg');
    echo sprintf("%s\t%dx%d\t%s\n", $key, $dims[0] ?? 0, $dims[1] ?? 0, $sources[$i]);
}

echo 'Installed '.count($keys)." bridal-shower blank arts.\n";
