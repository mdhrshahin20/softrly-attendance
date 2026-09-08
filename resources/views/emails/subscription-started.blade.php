@php
    /** @var \App\Domain\Billing\Models\Subscription $subscription */
@endphp
<x-mail::message>
# Welcome to {{ $appName }}

Your workspace **{{ $subscription->tenant?->name }}** is ready on the **{{ $subscription->plan?->name ?? 'Starter' }}** plan.

@if($subscription->isOnTrial())
Your trial is active until {{ $subscription->trial_ends_at?->toDateString() }}.
@endif

<x-mail::button :url="url('/dashboard')">
Open dashboard
</x-mail::button>

Thanks,  
{{ $appName }}
</x-mail::message>
