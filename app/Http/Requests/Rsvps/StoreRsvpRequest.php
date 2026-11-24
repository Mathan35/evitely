<?php

namespace App\Http\Requests\Rsvps;

use App\Enums\RsvpStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRsvpRequest extends FormRequest
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
            'guest_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:160'],
            'status' => ['required', Rule::in([
                RsvpStatus::Attending->value,
                RsvpStatus::NotAttending->value,
                RsvpStatus::Maybe->value,
            ])],
            'guest_count' => ['required_if:status,attending', 'nullable', 'integer', 'min:1', 'max:20'],
            'meal_preference' => ['nullable', 'string', Rule::in(array_keys(config('wedding.meal_preferences')))],
            'dietary_restrictions' => ['nullable', 'string', 'max:255'],
            'message' => ['nullable', 'string', 'max:1000'],
            'company' => ['nullable', 'string', 'max:120'],
            'job_title' => ['nullable', 'string', 'max:120'],
            'events' => ['nullable', 'array'],
            'events.*' => ['boolean'],
            'answers' => ['nullable', 'array'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('email')) {
            $this->merge(['email' => strtolower(trim((string) $this->input('email')))]);
        }

        if (is_array($this->input('events'))) {
            $events = [];

            foreach ($this->input('events') as $id => $attending) {
                $events[$id] = filter_var($attending, FILTER_VALIDATE_BOOLEAN);
            }

            $this->merge(['events' => $events]);
        }
    }
}
