<?php

/**
 * Install the 20 provided baby-shower blank-center arts into public gallery blank/.
 * Copies each source to card-{key}.jpg, -mobile.jpg, and -desktop.jpg (same art, like birthday).
 */
$assets = 'C:/Users/Abcom/.cursor/projects/c-Users-Abcom-Sites-wedding-invitation/assets';
$dest = __DIR__.'/../public/images/gallery/baby-shower/blank';

$keys = [
    'woodland',
    'cloudland',
    'olive',
    'terracotta',
    'safari',
    'celestial',
    'minimal-teddy',
    'balloon',
    'eucalyptus',
    'stars',
    'jungle',
    'retro-love',
    'picnic',
    'giraffe',
    'floral-bloom',
    'geometric',
    'ocean',
    'forest',
    'sage',
    'watercolor',
];

// Attachment order from the user (20 blank-center arts).
$sources = [
    'Frame_3d_Esthethic-1d2b121b-c8a9-4d54-83c8-dadf1394c741.jpg',
    '______________________________Christmas_background-0abe8eee-edeb-4be7-8b5b-8a48fa5ed8e0.jpg',
    'download__25_-0c91c1c6-da1d-45a9-8bc7-d7246a6f3e64.jpg',
    'download__23_-2d13bce3-01d6-4930-9d9c-dd5fc3305aee.jpg',
    'download__24_-c5d93911-bfa8-431a-8fa0-57590089bc51.jpg',
    'download__21_-e01bb52b-e910-4aec-a4e9-64928c78cde9.jpg',
    'download__22_-d6afe48e-97c0-4fe7-9b45-d196669c5dc5.jpg',
    'download__20_-c083d9d2-5b67-4ba5-911a-116cc142d279.jpg',
    'download__18_-753d4b8d-6dd4-46a4-8cb4-0247ba4e0954.jpg',
    'download__17_-397fcec7-c62f-4923-a97b-c85b1f5fe6c0.jpg',
    'download__19_-f3374e69-b346-4611-902c-728a7598b4e1.jpg',
    '___________-1fa9d2d4-3fe5-42cd-9b1c-0677cead6e73.jpg',
    'download__16_-4e12afd0-b764-4e74-a9e9-4decd0bbde07.jpg',
    '______________________________________________-5056e6d0-d903-42a0-a341-ac64375b5ad6.jpg',
    'download__15_-6d0fdaaf-65c7-4743-9525-ffbaa8b9db82.jpg',
    '30_Ralph_Lauren_Nursery_Ideas_Full_of_Luxury_and_C-62adceab-593b-495f-848e-51598a65ec55.jpg',
    'Soft_Pastel_Baby_Shower_Poster_Design-a5bef2ae-113e-43b2-8cf4-99ff490c201b.jpg',
    'Infant_Baby_Boy_Clipart___Adorable_Blue_Hot_Air-18af723a-d801-4f0e-a073-0d630fee4491.jpg',
    'Looking_for_something_for_kids_gifting_______We_ve_-881d23d7-4941-4247-9073-041e1b86d26b.jpg',
    'download__14_-d3cf169f-313f-4930-b46c-594f48feba79.jpg',
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

    $targets = [
        $dest.'/card-'.$key.'.jpg',
        $dest.'/card-'.$key.'-mobile.jpg',
        $dest.'/card-'.$key.'-desktop.jpg',
    ];

    foreach ($targets as $target) {
        if (! copy($src, $target)) {
            fwrite(STDERR, "Failed copy to {$target}\n");
            exit(1);
        }
    }

    $dims = getimagesize($dest.'/card-'.$key.'-mobile.jpg');
    echo sprintf("%s\t%dx%d\t%s\n", $key, $dims[0] ?? 0, $dims[1] ?? 0, $sources[$i]);
}

echo 'Installed '.count($keys)." baby-shower blank arts.\n";
