@php
    /** @var \App\Domain\Billing\Models\Invoice $invoice */
@endphp
<x-mail::message>
# Invoice {{ $invoice->number }}

Hello {{ $invoice->billed_to_name ?? $invoice->billed_to_company ?? 'there' }},

Thank you for subscribing to {{ $appName }}. Your invoice is ready.

**Amount:** {{ $invoice->currency }} {{ number_format($invoice->amount) }}  
**Status:** {{ $invoice->status->label() }}  
**Issued:** {{ $invoice->issued_at?->toDateString() }}

@if($invoice->items->isNotEmpty())
<x-mail::table>
| Description | Amount |
|:------------|-------:|
@foreach($invoice->items as $item)
| {{ $item->description }} | {{ $invoice->currency }} {{ number_format($item->amount) }} |
@endforeach
</x-mail::table>
@endif

If you have questions, reply to this email and our team will help.

Thanks,  
{{ $appName }}
</x-mail::message>
