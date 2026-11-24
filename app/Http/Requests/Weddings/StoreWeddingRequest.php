<?php

namespace App\Http\Requests\Weddings;

use App\Concerns\WeddingValidationRules;
use App\Models\Wedding;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreWeddingRequest extends FormRequest
{
    use WeddingValidationRules;

    public function authorize(): bool
    {
        return Gate::allows('create', Wedding::class);
    }

    protected function prepareForValidation(): void
    {
        $this->prepareWeddingBooleans();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            ...$this->weddingRules(true),
            'events' => ['nullable', 'array', 'max:20'],
            'events.*.title' => ['required', 'string', 'max:120'],
            'events.*.event_type' => ['nullable', 'string', 'max:40'],
            'events.*.description' => ['nullable', 'string', 'max:2000'],
            'events.*.event_date' => ['nullable', 'date'],
            'events.*.start_time' => ['nullable', 'date_format:H:i'],
            'events.*.end_time' => ['nullable', 'date_format:H:i'],
            'events.*.venue_name' => ['nullable', 'string', 'max:160'],
            'events.*.venue_address' => ['nullable', 'string', 'max:255'],
            'events.*.city' => ['nullable', 'string', 'max:80'],
            'events.*.dress_code' => ['nullable', 'string', 'max:120'],
            'events.*.timezone' => ['nullable', 'timezone'],
            'travel' => ['nullable', 'array', 'max:20'],
            'travel.*.kind' => ['nullable', 'string', 'max:40'],
            'travel.*.title' => ['required', 'string', 'max:120'],
            'travel.*.description' => ['nullable', 'string', 'max:2000'],
            'accommodations' => ['nullable', 'array', 'max:20'],
            'accommodations.*.hotel_name' => ['required', 'string', 'max:160'],
            'accommodations.*.address' => ['nullable', 'string', 'max:255'],
            'accommodations.*.phone' => ['nullable', 'string', 'max:40'],
            'accommodations.*.website' => ['nullable', 'url', 'max:255'],
            'accommodations.*.booking_url' => ['nullable', 'url', 'max:255'],
            'accommodations.*.price_info' => ['nullable', 'string', 'max:80'],
            'accommodations.*.description' => ['nullable', 'string', 'max:2000'],
            'guests' => ['nullable', 'array', 'max:200'],
            'guests.*.first_name' => ['required', 'string', 'max:80'],
            'guests.*.last_name' => ['nullable', 'string', 'max:80'],
            'guests.*.email' => ['nullable', 'email', 'max:160'],
            'guests.*.phone' => ['nullable', 'string', 'max:30'],
            'guests.*.country_code' => ['nullable', 'string', 'max:8'],
            'guests.*.relationship' => ['nullable', 'string', 'max:80'],
            'guests.*.number_of_guests' => ['nullable', 'integer', 'min:1', 'max:20'],
            'guests.*.notes' => ['nullable', 'string', 'max:1000'],
            'template' => ['nullable', 'string', 'max:80'],
            'card_template' => ['nullable', 'string', 'max:80'],
            'card_format' => ['nullable', 'string', 'max:40'],
            'publish' => ['sometimes', 'boolean'],
            'generate_card' => ['sometimes', 'boolean'],
        ];
    }
}
