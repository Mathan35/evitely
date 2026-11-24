<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ImageUploadService
{
    public function store(UploadedFile $file, string $directory): string
    {
        $mime = (string) $file->getMimeType();
        $allowed = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];

        if (! isset($allowed[$mime])) {
            throw ValidationException::withMessages([
                'photo' => 'Upload a JPEG, PNG, or WebP image.',
            ]);
        }

        if ($file->getSize() > 5 * 1024 * 1024) {
            throw ValidationException::withMessages([
                'photo' => 'Images must be 5 MB or smaller.',
            ]);
        }

        $info = @getimagesize($file->getRealPath());

        if ($info === false || $info[0] > 6000 || $info[1] > 6000) {
            throw ValidationException::withMessages([
                'photo' => 'Images must be valid and no larger than 6000 pixels on either side.',
            ]);
        }

        $name = Str::uuid()->toString().'.'.$allowed[$mime];

        return $file->storeAs($directory, $name, 'public');
    }
}
