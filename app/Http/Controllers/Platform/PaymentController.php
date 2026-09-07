<?php

namespace App\Http\Controllers\Platform;

use App\Domain\Billing\Models\Payment;
use App\Domain\Billing\Services\SubscriptionService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function index(): Response
    {
        $payments = Payment::query()
            ->with(['subscription.plan'])
            ->latest()
            ->paginate(25);

        return Inertia::render('platform/payments', [
            'payments' => $payments->through(fn (Payment $payment): array => [
                'id' => $payment->id,
                'tenant' => $payment->tenant?->name,
                'plan' => $payment->subscription?->plan?->name,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'gateway' => $payment->gateway,
                'transaction_id' => $payment->transaction_id,
                'status' => $payment->status->value,
                'status_label' => $payment->status->label(),
                'paid_at' => $payment->paid_at?->toDateTimeString(),
                'created_at' => $payment->created_at?->toDateTimeString(),
            ]),
        ]);
    }

    public function complete(Request $request, Payment $payment, SubscriptionService $subscriptions): RedirectResponse
    {
        $subscriptions->completePayment($payment, $request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Payment marked as paid.']);

        return back();
    }
}
