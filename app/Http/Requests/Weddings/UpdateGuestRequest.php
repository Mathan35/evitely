<?php

namespace App\Http\Requests\Weddings;

class UpdateGuestRequest extends StoreGuestRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $rules = parent::rules();
        $rules['first_name'] = ['sometimes', 'required', 'string', 'max:80'];

        return $rules;
    }
}
