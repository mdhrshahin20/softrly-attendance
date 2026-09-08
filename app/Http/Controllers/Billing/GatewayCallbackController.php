<?php

namespace App\Http\Controllers\Billing;

use App\Domain\Billing\Enums\PaymentStatus;
use App\Domain\Billing\Models\Payment;
use App\Domain\Billing\Services\SubscriptionService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class GatewayCallbackController extends Controller
{
    public function __construct(
        private readonly SubscriptionService $subscriptions,
    ) {}

    public function sslSuccess(Request $request): RedirectResponse
    {
        $this->completeFromTransaction((string) $request->input('tran_id'));

        return redirect('/billing')->with('toast', ['type' => 'success', 'message' => 'Payment received.']);
    }

    public function sslFail(): RedirectResponse
    {
        return redirect('/billing')->with('toast', ['type' => 'error', 'message' => 'SSLCommerz payment was not completed.']);
    }

    public function sslIpn(Request $request): Response
    {
        $this->completeFromTransaction((string) $request->input('tran_id'));

        return response('OK');
    }

    public function bkash(Request $request): RedirectResponse
    {
        if ($request->input('status') === 'success') {
            $this->completeFromTransaction((string) $request->input('paymentID'));

            return redirect('/billing')->with('toast', ['type' => 'success', 'message' => 'bKash payment received.']);
        }

        return redirect('/billing')->with('toast', ['type' => 'error', 'message' => 'bKash payment was not completed.']);
    }

    private function completeFromTransaction(string $transactionId): void
    {
        if ($transactionId === '') {
            return;
        }

        $payment = Payment::query()
            ->where('transaction_id', $transactionId)
            ->where('status', PaymentStatus::Pending)
            ->first();

        if ($payment === null) {
            return;
        }

        $this->subscriptions->completePayment($payment);
    }
}
