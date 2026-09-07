<?php

namespace App\Domain\Leave\Enums;

enum LeaveDurationType: string
{
    case FullDay = 'full_day';
    case FirstHalf = 'first_half';
    case SecondHalf = 'second_half';

    public function label(): string
    {
        return match ($this) {
            self::FullDay => 'Full day',
            self::FirstHalf => 'First half',
            self::SecondHalf => 'Second half',
        };
    }

    public function days(): float
    {
        return $this === self::FullDay ? 1.0 : 0.5;
    }
}
