<?php

namespace App\Domain\Payroll\Enums;

enum PayrollRunStatus: string
{
    case Draft = 'draft';
    case Processed = 'processed';
    case Paid = 'paid';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Processed => 'Processed',
            self::Paid => 'Paid',
        };
    }
}
