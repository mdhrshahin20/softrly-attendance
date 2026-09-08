<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->number }}</title>
    <style>
        body { font-family: ui-sans-serif, system-ui, sans-serif; color: #111; margin: 40px; }
        h1 { font-size: 24px; margin: 0 0 4px; }
        .muted { color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #e5e5e5; }
        th { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #666; }
        .total { font-weight: 700; font-size: 18px; }
        .header { display: flex; justify-content: space-between; gap: 24px; }
        @media print { .no-print { display: none; } }
    </style>
</head>
<body>
    <p class="no-print muted">Use Print → Save as PDF to keep a copy.</p>
    <div class="header">
        <div>
            <h1>{{ $appName }}</h1>
            <div class="muted">Invoice {{ $invoice->number }}</div>
        </div>
        <div>
            <div><strong>{{ $invoice->status->label() }}</strong></div>
            <div class="muted">Issued {{ $invoice->issued_at?->toDateString() }}</div>
        </div>
    </div>
    <p>
        <strong>Bill to</strong><br>
        {{ $invoice->billed_to_company }}<br>
        {{ $invoice->billed_to_name }}<br>
        {{ $invoice->billed_to_email }}
    </p>
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->items as $item)
                <tr>
                    <td>{{ $item->description }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>{{ $invoice->currency }} {{ number_format($item->amount) }}</td>
                </tr>
            @endforeach
            <tr>
                <td class="total" colspan="2">Total</td>
                <td class="total">{{ $invoice->currency }} {{ number_format($invoice->amount) }}</td>
            </tr>
        </tbody>
    </table>
    @if($invoice->notes)
        <p class="muted">{{ $invoice->notes }}</p>
    @endif
</body>
</html>
