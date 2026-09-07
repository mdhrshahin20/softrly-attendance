<?php

namespace App\Domain\Billing\Enums;

enum PlanFeature: string
{
    case Attendance = 'attendance';
    case LeaveManagement = 'leave_management';
    case Holidays = 'holidays';
    case BasicReports = 'basic_reports';
    case Exports = 'exports';
    case AdvancedReports = 'advanced_reports';
    case MultipleOffices = 'multiple_offices';
    case CustomRoles = 'custom_roles';
    case AuditLog = 'audit_log';
    case ApiAccess = 'api_access';
    case CustomDomain = 'custom_domain';
    case LocationAttendance = 'location_attendance';

    public function label(): string
    {
        return match ($this) {
            self::Attendance => 'Attendance',
            self::LeaveManagement => 'Leave management',
            self::Holidays => 'Holidays',
            self::BasicReports => 'Basic reports',
            self::Exports => 'CSV exports',
            self::AdvancedReports => 'Advanced reports',
            self::MultipleOffices => 'Multiple offices',
            self::CustomRoles => 'Custom roles',
            self::AuditLog => 'Audit log',
            self::ApiAccess => 'API access',
            self::CustomDomain => 'Custom domain',
            self::LocationAttendance => 'Location attendance',
        };
    }
}
