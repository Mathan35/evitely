<?php

namespace App\Http\Requests\GuestPhotos;

use Illuminate\Foundation\Http\FormRequest;

class StoreGuestPhotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'caption' => ['nullable', 'string', 'max:400'],
            'photo' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'dimensions:max_width=6000,max_height=6000'],
        ];
    }
}
