<?php

namespace App\Domain\Payroll\Enums;

enum SalaryAdvanceStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Deducted = 'deducted';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
            self::Deducted => 'Deducted',
        };
    }
}
