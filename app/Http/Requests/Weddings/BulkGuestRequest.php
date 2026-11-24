<?php

namespace App\Http\Requests\Weddings;

use App\Models\Wedding;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class BulkGuestRequest extends FormRequest
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
            'action' => ['required', 'in:delete,assign_group,mark_sent,mark_shared,send_sms,send_whatsapp,retry_failed'],
            'guest_ids' => ['required', 'array', 'min:1'],
            'guest_ids.*' => ['integer'],
            'channel' => ['nullable', 'string', 'in:whatsapp,sms'],
            'guest_group_id' => ['required_if:action,assign_group', 'nullable', 'integer', Rule::exists('event_guest_groups', 'id')->where('event_id', $this->route('wedding')?->id)],
        ];
    }
}
