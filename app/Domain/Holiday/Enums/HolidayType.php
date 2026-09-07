<?php

namespace App\Domain\Holiday\Enums;

enum HolidayType: string
{
    case Public = 'public';
    case Company = 'company';
    case Optional = 'optional';

    public function label(): string
    {
        return match ($this) {
            self::Public => 'Public holiday',
            self::Company => 'Company holiday',
            self::Optional => 'Optional holiday',
        };
    }
}
