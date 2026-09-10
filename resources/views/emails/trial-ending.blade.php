@php
    /** @var \App\Domain\Billing\Models\Subscription $subscription */
    $days = $subscription->trial_ends_at !== null
        ? max(0, (int) now()->startOfDay()->diffInDays($subscription->trial_ends_at->startOfDay(), false))
        : null;
@endphp
<x-mail::message>
# Your trial ends {{ $days !== null ? 'in '.$days.' day(s)' : 'soon' }}

Hello,

The **{{ $subscription->plan?->name }}** trial for **{{ $subscription->tenant?->name }}** ends on **{{ $subscription->trial_ends_at?->toFormattedDateString() }}**.

Choose a plan to keep attendance, leave, and payroll running without interruption.

<x-mail::button :url="url('/billing')">
Choose a plan
</x-mail::button>

Thanks,  
{{ $appName }}
</x-mail::message>
