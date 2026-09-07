<?php

namespace App\Domain\Shared\Enums;

enum EmploymentType: string
{
    case Permanent = 'permanent';
    case Probation = 'probation';
    case Contract = 'contract';
    case Intern = 'intern';
    case PartTime = 'part_time';
}
