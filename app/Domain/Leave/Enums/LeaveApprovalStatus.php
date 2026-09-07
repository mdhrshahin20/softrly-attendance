<?php

namespace App\Domain\Leave\Enums;

enum LeaveApprovalStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
}
