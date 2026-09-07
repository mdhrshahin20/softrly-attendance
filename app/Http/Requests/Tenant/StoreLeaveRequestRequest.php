<?php

namespace App\Http\Requests\Tenant;

use App\Domain\Leave\Enums\LeaveDurationType;
use App\Domain\Tenant\Models\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeaveRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('leave.apply') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'leave_type_id' => [
                'required',
                'integer',
                Rule::exists('leave_types', 'id')->where('tenant_id', Tenant::current()?->id),
            ],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'duration_type' => ['required', Rule::enum(LeaveDurationType::class)],
            'reason' => ['required', 'string', 'max:1000'],
            'attachment' => ['nullable', 'file', 'max:2048', 'mimes:pdf,jpg,jpeg,png'],
        ];
    }
}
