<?php

/**
 * Install the 20 provided party blank-center arts into public gallery blank/.
 */
$assets = 'C:/Users/Abcom/.cursor/projects/c-Users-Abcom-Sites-wedding-invitation/assets';
$dest = __DIR__.'/../public/images/gallery/party/blank';

$keys = [
    'confetti-hats',
    'ribbon-stars',
    'bunting-balloons',
    'sketch-dinner',
    'balloon-blush',
    'disco-sketch',
    'linen-feast',
    'garden-table',
    'classical-arch',
    'navy-icons',
    'gift-cake',
    'rose-gold',
    'watercolor-gifts',
    'blossom-arch',
    'lantern-drape',
    'peach-arch',
    'pink-party',
    'cocktail-spread',
    'feast-lights',
    'confetti-flags',
];

$sources = [
    'download__26_-5bb8c0e8-ca7a-4b3a-94c9-d38df02107fe.jpg',
    'text_template-d1357beb-9c81-488f-8556-7201168a1fdf.jpg',
    'download__24_-fa24c569-c766-4ff7-abd8-ea7ef3fbbe81.jpg',
    'download__21_-3b677292-f6fe-4d44-bd02-5a39c0ab9b46.jpg',
    'download__25_-c957b2eb-140e-4b56-ba2b-7c99fa3e7624.jpg',
    'download__20_-bd5a0b5d-8e7d-4ab8-9355-32945018ca59.jpg',
    'download__17_-97848dd7-55d9-4c9e-8d0f-35b93583fa03.jpg',
    'download__18_-8afd0e5c-3c27-40c0-8292-80d247554181.jpg',
    'download__16_-25dc67ee-8289-4c9c-a2cb-12faf5498fbf.jpg',
    'download__19_-9f8db4c2-b2e2-4523-8448-93fe217626f4.jpg',
    '____________________________________________________-87a443e0-d0b7-42d6-965d-611c0e76ff26.jpg',
    'golden_birthday_frame-06c4854a-592c-4c12-9cbe-dd1947a7bd0a.jpg',
    '__________________________________________________-f6c75830-383d-4cd6-aee4-4a351ebe0a76.jpg',
    'download__15_-df165401-e56c-4ba3-b349-eebeeb68d009.jpg',
    'download__14_-1f117884-c3a0-46ee-883e-f1d1d0d5f6b4.jpg',
    'wedding_background-9edcd06d-f4ef-4e10-9471-61f5c3d35689.jpg',
    'download__27_-ddf12539-2f77-443d-b56f-48bfcc94c47f.jpg',
    'download__22_-7a4bfe48-6ada-4179-bd6b-bf62c44e3e43.jpg',
    'download__23_-721c7b8d-af34-411a-b13d-32802bce7d2e.jpg',
    'Confetti_and_Corner_Flags_-_Printable_Party_Invita-84854f8d-94e6-4eed-9993-081c849de952.jpg',
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

echo 'Installed '.count($keys)." party blank arts.\n";
