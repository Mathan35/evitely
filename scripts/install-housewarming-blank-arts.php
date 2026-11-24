<?php

/**
 * Install the 20 provided housewarming blank-center arts into public gallery blank/.
 */
$assets = 'C:/Users/Abcom/.cursor/projects/c-Users-Abcom-Sites-wedding-invitation/assets';
$dest = __DIR__.'/../public/images/gallery/housewarming/blank';

$keys = [
    'key-corner-filigree',
    'split-peach-cottage',
    'keys-gold-frame',
    'top-cottage-watercolor',
    'palm-villa',
    'pink-floral-cottage',
    'linen-modern-house',
    'linen-sketch-house',
    'mandala-garden-home',
    'foliage-gold-outline',
    'parchment-family-hearth',
    'navy-rose-bluehouse',
    'blush-heart-cottage',
    'ink-line-cottage',
    'country-cottage-gold',
    'mediterranean-blue-door',
    'mint-arch-cottage',
    'night-moon-cottage',
    'chimney-cloud-cottage',
    'peach-bloom-cottage',
];

$sources = [
    'download__27_-05b14c9d-2136-4c6d-9738-be3ac8887725.jpg',
    '____-0ac3cee6-553e-4d90-92d5-3f525ea02fb3.jpg',
    'download__26_-fedaed2e-efe6-4e66-9d92-3c7d8ba54472.jpg',
    'download__24_-ad72ea1e-2e90-4d63-897f-bba48c527f70.jpg',
    'download__21_-767786f3-d8f0-4e65-acb0-21fc0a16fb60.jpg',
    'download__25_-9f2c994f-dcd8-48c4-b789-976253746e68.jpg',
    'download__22_-fffbb654-02c6-40bc-80ca-4f851eaeb978.jpg',
    'download__20_-5fd68723-a161-4923-8c14-a34bc9fb04f9.jpg',
    'download__18_-b046fa1d-41ec-4cb4-8698-76360b462138.jpg',
    'download__30_-65205a97-6b83-4f32-94b2-0f5dab397486.jpg',
    'Download_premium_image_of_Family_insurance_brown_p-4ece14d8-0105-488b-b3d7-5f0f2a553400.jpg',
    'download__16_-e85ebb5a-efaf-46f6-87c2-200e396f0008.jpg',
    'download__15_-13a98180-a881-4469-8cdb-cd1cd1f9193e.jpg',
    'Blank_Housewarming_Party_Invitation_Templates__Pri-1758605e-ec51-4ae5-a04d-c122e4b6f759.jpg',
    'download__17_-8115ac2c-4ab0-4cc0-b943-e2ff3cc28e95.jpg',
    'download__29_-d6679e1e-ab8e-4504-8194-9df4daf78920.jpg',
    'download__14_-5b6dc2b2-fa8f-454a-9f89-ed4b056f8e71.jpg',
    'download__23_-97a23e7e-6acd-4c8c-9a4b-43c9f6cf73e2.jpg',
    'download__28_-f53e92fa-5e2c-4030-a5ed-5fd66c029f8e.jpg',
    'Blank_Housewarming_Party_Invitation_Templates-ca624cc0-0c89-47fb-bfd2-5b3dcb664985.jpg',
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

echo 'Installed '.count($keys)." housewarming blank arts.\n";
