<?php

namespace App\Http\Requests\Weddings;

class UpdateWeddingEventRequest extends StoreWeddingEventRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['title'] = ['sometimes', 'required', 'string', 'max:120'];

        return $rules;
    }
}
