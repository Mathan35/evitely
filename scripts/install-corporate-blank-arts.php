<?php

/**
 * Install the 20 provided corporate blank-center arts into public gallery blank/.
 */
$assets = 'C:/Users/Abcom/.cursor/projects/c-Users-Abcom-Sites-wedding-invitation/assets';
$dest = __DIR__.'/../public/images/gallery/corporate/blank';

$keys = [
    'boardroom-blueprint',
    'celebration-hands-wave',
    'purple-office-team',
    'peach-office-desk',
    'online-cert-desk',
    'corner-tech-exam',
    'math-sage-oval',
    'book-forum-readers',
    'megaphone-announce',
    'exam-pc-corners',
    'blue-binder-circle',
    'desk-workspace-hands',
    'tech-desk-blue',
    'skyline-team-v',
    'handshake-flare',
    'stationery-cream-frame',
    'mint-chart-growth',
    'ink-desk-gadgets',
    'gear-bulb-frame',
    'presentation-torn-header',
];

$sources = [
    'download__21_-ab090596-18cf-40b9-b931-80da48731822.jpg',
    'Simple_Personal_Resume_Literary_Background_Materia-45f75656-8052-4448-838f-15e7b5d06f3c.jpg',
    'Student_Union_Recruits_New_Students_Start_New_Stud-27bc92db-ae16-44fc-96b5-f24a2a1d3df5.jpg',
    'Corporate_Workplace_Poster_Background_Wallpaper_Im-110782d7-1a81-4ccf-b6c4-a5d5cb6b895f.jpg',
    'Pin_by_Nadia_on_jana_s___Powerpoint_background_des-e768f0a7-e752-4d5a-9f5a-f9d0d357629a.jpg',
    'download__20_-3c698523-0735-4730-a6d2-6d3da20669f7.jpg',
    'download__18_-fb8e04d7-bc1e-483a-a512-e9ab28ff0a1b.jpg',
    'desain_poster_instagram_story-65070e2b-da84-4e29-885c-a14edda5136e.jpg',
    'Horn_Frame_Blue_Simple_Recruitment_Background_Publ-65bc8d2f-85a0-4de9-9410-741600245322.jpg',
    'download__17_-c6ea36a5-8c39-42cc-8169-7bfb049bcb9a.jpg',
    '______________________________________________-bf88db00-f072-4375-a517-78ae4f81ea07.jpg',
    'Cartoon_Workplace_Recruiting_Newcomers_Background_-252e26d2-672b-4168-8ea1-354a20e81677.jpg',
    'Blue_Tech_H5_Layered_Background_Wallpaper_Image_Fo-00883fc4-dfdb-4785-ab57-055b4bd65c95.jpg',
    'Recruitment_Looking_For_A_Bull_Poster_Background_W-7f031149-6d78-4bca-a619-623b07a6f7b1.jpg',
    'Business_Handshake_Finance_Business_Cooperation_At-1262af04-06a6-44b3-ab2a-55723f52c525.jpg',
    'School_project_school_background-0654c931-8f72-4a99-9b12-daa36a062dce.jpg',
    'download__19_-d183c320-23ff-427d-ae87-560dc3a2a431.jpg',
    'download__16_-b71b678b-53f5-43d3-a9fd-15c4389c108e.jpg',
    'download__15_-508e6a33-cd93-48f6-bd20-d2cb535a8b9c.jpg',
    'download__14_-70139a9f-9072-4cfc-97a4-b955bcac24ff.jpg',
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

echo 'Installed '.count($keys)." corporate blank arts.\n";
