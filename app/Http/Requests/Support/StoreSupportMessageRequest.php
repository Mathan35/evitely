<?php

namespace App\Http\Requests\Support;

use App\Models\SupportMessage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupportMessageRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:120'],
            'topic' => ['required', 'string', Rule::in(array_keys(SupportMessage::TOPICS))],
            'message' => ['required', 'string', 'min:10', 'max:4000'],
            'page_url' => ['nullable', 'string', 'max:500'],
            // Honeypot — bots fill this; humans leave it empty.
            'company' => ['nullable', 'string', 'max:200'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'message.min' => 'Please share a little more detail (at least 10 characters).',
        ];
    }
}
