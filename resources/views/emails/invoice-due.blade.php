@php
    /** @var \App\Domain\Billing\Models\Invoice $invoice */
@endphp
<x-mail::message>
# {{ $overdue ? 'Invoice overdue' : 'Invoice due soon' }}

Hello,

Invoice **{{ $invoice->number }}** for **{{ $invoice->currency }} {{ number_format($invoice->amount) }}** was issued for **{{ $invoice->billed_to_company ?? $invoice->tenant?->name }}** and is {{ $overdue ? 'now overdue' : 'due soon' }}.

@if($invoice->due_at)
Due date: **{{ $invoice->due_at->toFormattedDateString() }}**
@endif

@if($overdue)
Please settle this invoice to avoid any interruption to your workspace.
@else
You can settle this invoice from billing before the due date.
@endif

<x-mail::button :url="url('/billing')">
View billing
</x-mail::button>

Thanks,  
{{ $appName }}
</x-mail::message>
