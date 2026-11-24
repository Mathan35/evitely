<?php

namespace App\Http\Requests\Weddings;

use App\Models\Wedding;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StorePhotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $wedding = $this->route('wedding');

        return $wedding instanceof Wedding && Gate::allows('update', $wedding);
    }

    protected function prepareForValidation(): void
    {
        if ($this->exists('as_hero')) {
            $this->merge(['as_hero' => $this->boolean('as_hero')]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'photo' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'dimensions:max_width=6000,max_height=6000'],
            'caption' => ['nullable', 'string', 'max:180'],
            'as_hero' => ['sometimes', 'boolean'],
        ];
    }
}
