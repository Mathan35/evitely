<?php

namespace App\Http\Requests\Weddings;

use App\Concerns\WeddingValidationRules;
use App\Models\Wedding;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateWeddingRequest extends FormRequest
{
    use WeddingValidationRules;

    public function authorize(): bool
    {
        $wedding = $this->route('wedding');

        return $wedding instanceof Wedding && Gate::allows('update', $wedding);
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
        return $this->weddingRules(false);
    }
}
