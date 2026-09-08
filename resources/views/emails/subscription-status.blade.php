@php
    /** @var \App\Domain\Billing\Models\Subscription $subscription */
@endphp
<x-mail::message>
# Subscription {{ $event }}

Hello,

Your **{{ $subscription->tenant?->name }}** subscription ({{ $subscription->plan?->name }}) has been **{{ $event }}**.

@if($event === 'expired' || $event === 'cancelled')
You can resubscribe anytime from billing to restore access for your team.
@endif

<x-mail::button :url="url('/billing')">
Manage billing
</x-mail::button>

Thanks,  
{{ $appName }}
</x-mail::message>
