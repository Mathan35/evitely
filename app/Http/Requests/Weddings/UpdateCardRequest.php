<?php

namespace App\Http\Requests\Weddings;

use App\Models\Wedding;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateCardRequest extends FormRequest
{
    public function authorize(): bool
    {
        $wedding = $this->route('wedding');

        return $wedding instanceof Wedding && Gate::allows('update', $wedding);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'format' => ['required', 'string', 'max:40'],
            'width' => ['nullable', 'integer', 'min:200', 'max:4000'],
            'height' => ['nullable', 'integer', 'min:200', 'max:4000'],
            'document' => ['required', 'array'],
            'document.background' => ['nullable', 'string', 'max:40'],
            // Keep invitation art through autosave — previously stripped because it was unvalidated.
            'document.backgroundImage' => ['nullable', 'string'],
            'document.template' => ['nullable', 'string', 'max:120'],
            // Keep layout metadata so syncCardGeometry does not rematerialize over user edits.
            'document.layout_version' => ['nullable', 'integer', 'min:1'],
            'document.occasion' => ['nullable', 'string', 'max:80'],
            'document.fitScale' => ['nullable', 'numeric'],
            'document.elements' => ['nullable', 'array'],
            'document.elements.*.id' => ['required', 'string', 'max:80'],
            'document.elements.*.type' => ['required', 'string', 'max:40'],
            'document.elements.*.text' => ['nullable', 'string'],
            'document.elements.*.src' => ['nullable', 'string'],
            'document.elements.*.x' => ['nullable', 'numeric'],
            'document.elements.*.y' => ['nullable', 'numeric'],
            'document.elements.*.width' => ['nullable', 'numeric'],
            'document.elements.*.height' => ['nullable', 'numeric'],
            'document.elements.*.fontSize' => ['nullable', 'numeric'],
            'document.elements.*.fontWeight' => ['nullable'],
            'document.elements.*.letterSpacing' => ['nullable', 'numeric'],
            'document.elements.*.lineHeight' => ['nullable', 'numeric'],
            'document.elements.*.color' => ['nullable', 'string', 'max:40'],
            'document.elements.*.align' => ['nullable', 'string', 'max:20'],
            'document.elements.*.font' => ['nullable', 'string', 'max:120'],
            'document.elements.*.rotation' => ['nullable', 'numeric'],
            'document.elements.*.background' => ['nullable', 'string', 'max:40'],
            'document.elements.*.objectPosition' => ['nullable', 'string', 'max:40'],
            'document.elements.*.opacity' => ['nullable', 'numeric'],
            'document.elements.*.zIndex' => ['nullable', 'numeric'],
            'document.elements.*.blur' => ['nullable', 'numeric'],
            'document.elements.*.borderRadius' => ['nullable', 'numeric'],
            'document.elements.*.url' => ['nullable', 'string'],
            'document.elements.*.label' => ['nullable', 'string', 'max:120'],
            'document.elements.*.locked' => ['nullable', 'boolean'],
        ];
    }
}
