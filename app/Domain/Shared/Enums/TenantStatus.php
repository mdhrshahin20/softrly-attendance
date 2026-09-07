<?php

namespace App\Domain\Shared\Enums;

enum TenantStatus: string
{
    case Trial = 'trial';
    case Active = 'active';
    case Suspended = 'suspended';
    case Cancelled = 'cancelled';
    case Expired = 'expired';
}
