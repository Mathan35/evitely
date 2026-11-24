<?php

/**
 * Install the 20 provided graduation blank-center arts into public gallery blank/.
 */
$assets = 'C:/Users/Abcom/.cursor/projects/c-Users-Abcom-Sites-wedding-invitation/assets';
$dest = __DIR__.'/../public/images/gallery/graduation/blank';

$keys = [
    'kraft-scrap',
    'classroom-fade',
    'chalkboard-rows',
    'autumn-books',
    'library-shelves',
    'stationery-desk',
    'backpack-autumn',
    'school-bunting',
    'students-horizon',
    'cap-diploma',
    'scholarly-desk',
    'doodle-dreams',
    'book-tree',
    'gold-florals',
    'yellow-graduate',
    'gold-ribbon',
    'damask-cap',
    'rose-books',
    'navy-filigree',
    'chalk-classroom',
];

$sources = [
    'download__25_-52f9a48f-1575-4cab-8ec5-c07bea16acb8.jpg',
    'download__23_-07d5e6d8-7227-452e-9441-61c5438cd595.jpg',
    '1120200107292725591-063614d1-8ae6-449a-8d58-53e01120b6e9.jpg',
    'download__21_-5694bfa8-0a2b-42dd-9fc2-01b7eee6a5dd.jpg',
    'download__22_-8a568f14-862f-438d-bf3f-1d6967de0fc3.jpg',
    'reCAPTCHA_Checkbox-511af470-f3fd-489c-b86e-2c3cdf417831.jpg',
    '__________________1_______________________________-a4891eec-cd80-441e-add2-590bb2271684.jpg',
    'School_Season_Student_Start_School_Supplies_Discou-ddcda610-9024-4481-9d5b-874061251694.jpg',
    'school_students-435bae69-1cb9-4881-8278-7e2ee8e97e24.jpg',
    '_____________________-a72f8552-d126-4645-a747-53bb585edb6b.jpg',
    'download__19_-e400a675-d84f-488e-b405-dc937087c8bc.jpg',
    'education_background-dedee01a-61a2-423c-ab82-7c0e19a94d5a.jpg',
    'download__20_-622471b9-2b94-4f12-84d8-e34cb17c7e5c.jpg',
    'download__18_-06d8c0db-c01b-4dbf-8edb-20f5ea2ec730.jpg',
    'download__17_-abba82c9-2b27-4760-9fe1-8288b0889152.jpg',
    'Elegant_Gold_Graduation_Template___Plantilla_de_Gr-7368fca5-0832-4e06-97e4-cdd55579783d.jpg',
    'download__16_-9017a208-6fea-48d8-b8e8-68db6f9c09b2.jpg',
    'download__14_-143f1e9a-2b53-4037-bee5-a27b16c37e29.jpg',
    'download__15_-3ea2eaf8-f4d4-4640-8ce9-07b6a55b8c01.jpg',
    'download__24_-a4033ffc-e4d2-4d55-b003-11bdd6383360.jpg',
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

echo 'Installed '.count($keys)." graduation blank arts.\n";
