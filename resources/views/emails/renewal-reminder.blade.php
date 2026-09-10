@php
    /** @var \App\Domain\Billing\Models\Subscription $subscription */
@endphp
<x-mail::message>
# Your subscription renews soon

Hello,

Your **{{ $subscription->plan?->name }}** subscription for **{{ $subscription->tenant?->name }}** renews on **{{ $subscription->current_period_end?->toFormattedDateString() }}**.

No action is needed if your payment method is up to date. You can review or change your plan at any time from billing.

<x-mail::button :url="url('/billing')">
Manage billing
</x-mail::button>

Thanks,  
{{ $appName }}
</x-mail::message>
