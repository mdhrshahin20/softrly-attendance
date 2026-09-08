<?php

namespace App\Http\Controllers\Platform;

use App\Domain\Billing\Models\Invoice;
use App\Domain\Billing\Services\InvoiceService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function __construct(
        private readonly InvoiceService $invoices,
    ) {}

    public function index(Request $request): Response
    {
        $invoices = Invoice::query()
            ->with(['tenant', 'subscription.plan', 'payment', 'items'])
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('number', 'like', '%'.$search.'%')
                        ->orWhere('billed_to_email', 'like', '%'.$search.'%')
                        ->orWhere('billed_to_company', 'like', '%'.$search.'%');
                });
            })
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('platform/invoices', [
            'invoices' => $invoices->through(fn (Invoice $invoice): array => $invoice->toAdminArray()),
            'filters' => [
                'search' => $request->string('search')->toString() ?: null,
            ],
        ]);
    }

    public function show(Invoice $invoice): Response
    {
        $invoice->load(['items', 'tenant', 'subscription.plan', 'payment']);

        return Inertia::render('platform/invoice-show', [
            'invoice' => $invoice->toAdminArray(),
        ]);
    }

    public function download(Invoice $invoice): HttpResponse
    {
        $html = $this->invoices->printHtml($invoice);

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$invoice->number.'.html"',
        ]);
    }

    public function print(Invoice $invoice): HttpResponse
    {
        return response($this->invoices->printHtml($invoice));
    }

    public function send(Invoice $invoice): RedirectResponse
    {
        $this->invoices->sendToTenant($invoice);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Invoice emailed to '.$invoice->billed_to_email.'.']);

        return back();
    }
}
