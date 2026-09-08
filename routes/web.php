<?php

use App\Http\Controllers\Billing\GatewayCallbackController;
use App\Http\Controllers\Platform\DashboardController as PlatformDashboardController;
use App\Http\Controllers\Platform\GatewaySettingsController as PlatformGatewaySettingsController;
use App\Http\Controllers\Platform\InvoiceController as PlatformInvoiceController;
use App\Http\Controllers\Platform\LeadController as PlatformLeadController;
use App\Http\Controllers\Platform\MarketingController as PlatformMarketingController;
use App\Http\Controllers\Platform\PaymentController as PlatformPaymentController;
use App\Http\Controllers\Platform\PlanController as PlatformPlanController;
use App\Http\Controllers\Platform\ReportController as PlatformReportController;
use App\Http\Controllers\Platform\TenantController as PlatformTenantController;
use App\Http\Controllers\PricingController;
use App\Http\Controllers\Tenant\AdvancedReportController;
use App\Http\Controllers\Tenant\ApiTokenController;
use App\Http\Controllers\Tenant\AttendanceController;
use App\Http\Controllers\Tenant\AttendanceReportController;
use App\Http\Controllers\Tenant\AttendanceSettingsController;
use App\Http\Controllers\Tenant\AuditLogController;
use App\Http\Controllers\Tenant\BillingController;
use App\Http\Controllers\Tenant\DashboardController;
use App\Http\Controllers\Tenant\DepartmentController;
use App\Http\Controllers\Tenant\DesignationController;
use App\Http\Controllers\Tenant\DeviceController;
use App\Http\Controllers\Tenant\DomainController;
use App\Http\Controllers\Tenant\EmployeeController;
use App\Http\Controllers\Tenant\EmployeeImportController;
use App\Http\Controllers\Tenant\EmployeeSalaryController;
use App\Http\Controllers\Tenant\HolidayController;
use App\Http\Controllers\Tenant\LeaveApprovalController;
use App\Http\Controllers\Tenant\LeaveRequestController;
use App\Http\Controllers\Tenant\LeaveTypeController;
use App\Http\Controllers\Tenant\NotificationController;
use App\Http\Controllers\Tenant\OfficeController;
use App\Http\Controllers\Tenant\PayrollRunController;
use App\Http\Controllers\Tenant\PayslipController;
use App\Http\Controllers\Tenant\RoleController;
use App\Http\Controllers\Tenant\SalaryAdvanceController;
use App\Http\Controllers\Tenant\SalaryReportController;
use App\Http\Controllers\Tenant\ShiftController;
use App\Http\Controllers\Tenant\WorkingDayController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::inertia('features', 'marketing/features')->name('features');
Route::get('pricing', PricingController::class)->name('pricing');
Route::inertia('about', 'marketing/about')->name('about');
Route::inertia('contact', 'marketing/contact')->name('contact');
Route::inertia('privacy', 'marketing/privacy')->name('privacy');
Route::inertia('terms', 'marketing/terms')->name('terms');

Route::get('billing/gateways/sslcommerz/success', [GatewayCallbackController::class, 'sslSuccess'])->name('billing.gateways.sslcommerz.success');
Route::get('billing/gateways/sslcommerz/fail', [GatewayCallbackController::class, 'sslFail'])->name('billing.gateways.sslcommerz.fail');
Route::post('billing/gateways/sslcommerz/ipn', [GatewayCallbackController::class, 'sslIpn'])->name('billing.gateways.sslcommerz.ipn');
Route::match(['get', 'post'], 'billing/gateways/bkash/callback', [GatewayCallbackController::class, 'bkash'])->name('billing.gateways.bkash');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
});

Route::middleware(['auth', 'verified', 'tenant', 'tenant.session'])->group(function () {
    Route::get('billing', [BillingController::class, 'index'])->name('billing.index');
    Route::post('billing/subscribe', [BillingController::class, 'subscribe'])->name('billing.subscribe');
    Route::post('billing/cancel', [BillingController::class, 'cancel'])->name('billing.cancel');
    Route::get('billing/invoices/{invoice}/download', [BillingController::class, 'downloadInvoice'])->name('billing.invoices.download');
    Route::get('billing/invoices/{invoice}/print', [BillingController::class, 'printInvoice'])->name('billing.invoices.print');

    Route::middleware('subscription.active')->group(function () {
        Route::post('attendance/check-in', [AttendanceController::class, 'checkIn'])
            ->middleware(['active.employee', 'office.network'])
            ->name('attendance.check-in');

        Route::post('attendance/check-out', [AttendanceController::class, 'checkOut'])
            ->middleware(['active.employee', 'office.network'])
            ->name('attendance.check-out');

        Route::post('attendance/manual', [AttendanceController::class, 'storeManual'])
            ->name('attendance.manual');

        Route::get('attendance/calendar', [AttendanceController::class, 'calendar'])
            ->name('attendance.calendar');

        Route::get('reports/attendance', [AttendanceReportController::class, 'index'])
            ->name('reports.attendance');
        Route::get('reports/advanced', [AdvancedReportController::class, 'index'])
            ->name('reports.advanced');
        Route::get('reports/salary', [SalaryReportController::class, 'index'])
            ->name('reports.salary');

        Route::get('employees/export', [EmployeeController::class, 'export'])->name('employees.export');
        Route::get('employees/import', [EmployeeImportController::class, 'create'])->name('employees.import');
        Route::get('employees/import/template', [EmployeeImportController::class, 'template'])->name('employees.import.template');
        Route::post('employees/import/preview', [EmployeeImportController::class, 'preview'])->name('employees.import.preview');
        Route::post('employees/import', [EmployeeImportController::class, 'store'])->name('employees.import.store');
        Route::resource('employees', EmployeeController::class);
        Route::resource('departments', DepartmentController::class)->except(['show', 'create', 'edit']);
        Route::resource('designations', DesignationController::class)->except(['show', 'create', 'edit']);
        Route::get('offices/detect-ip', [OfficeController::class, 'detectIp'])->name('offices.detect-ip');
        Route::resource('offices', OfficeController::class)->except(['show', 'create', 'edit']);
        Route::post('offices/{office}/networks', [OfficeController::class, 'storeNetwork'])->name('offices.networks.store');
        Route::delete('office-networks/{network}', [OfficeController::class, 'destroyNetwork'])->name('office-networks.destroy');
        Route::resource('shifts', ShiftController::class)->except(['show', 'create', 'edit']);

        Route::get('leave', [LeaveRequestController::class, 'index'])->name('leave.index');
        Route::post('leave', [LeaveRequestController::class, 'store'])->name('leave.store');
        Route::get('leave/applications', [LeaveRequestController::class, 'applications'])->name('leave.applications');
        Route::get('leave/approvals', [LeaveApprovalController::class, 'index'])->name('leave.approvals');
        Route::get('leave/types', [LeaveTypeController::class, 'index'])->name('leave.types.index');
        Route::post('leave/types', [LeaveTypeController::class, 'store'])->name('leave.types.store');
        Route::put('leave/types/{leave_type}', [LeaveTypeController::class, 'update'])->name('leave.types.update');
        Route::delete('leave/types/{leave_type}', [LeaveTypeController::class, 'destroy'])->name('leave.types.destroy');
        Route::get('leave/{leave}', [LeaveRequestController::class, 'show'])->name('leave.show');
        Route::get('leave/{leave}/attachment', [LeaveRequestController::class, 'attachment'])->name('leave.attachment');
        Route::post('leave/{leave}/cancel', [LeaveRequestController::class, 'cancel'])->name('leave.cancel');
        Route::post('leave/{leave}/approve', [LeaveApprovalController::class, 'approve'])->name('leave.approve');
        Route::post('leave/{leave}/reject', [LeaveApprovalController::class, 'reject'])->name('leave.reject');

        Route::get('holidays', [HolidayController::class, 'index'])->name('holidays.index');
        Route::post('holidays', [HolidayController::class, 'store'])->name('holidays.store');
        Route::delete('holidays/{holiday}', [HolidayController::class, 'destroy'])->name('holidays.destroy');

        Route::get('working-days', [WorkingDayController::class, 'index'])->name('working-days.index');
        Route::put('working-days', [WorkingDayController::class, 'update'])->name('working-days.update');

        Route::get('settings/attendance', [AttendanceSettingsController::class, 'index'])->name('settings.attendance');
        Route::put('settings/attendance', [AttendanceSettingsController::class, 'update'])->name('settings.attendance.update');

        Route::get('devices', [DeviceController::class, 'index'])->name('devices.index');
        Route::post('devices/{device}/trust', [DeviceController::class, 'trust'])->name('devices.trust');
        Route::post('devices/{device}/untrust', [DeviceController::class, 'untrust'])->name('devices.untrust');
        Route::delete('devices/{device}', [DeviceController::class, 'destroy'])->name('devices.destroy');

        Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
        Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
        Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
        Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');

        Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');

        Route::get('settings/domains', [DomainController::class, 'index'])->name('settings.domains');
        Route::post('settings/domains', [DomainController::class, 'store'])->name('settings.domains.store');
        Route::delete('settings/domains/{domain}', [DomainController::class, 'destroy'])->name('settings.domains.destroy');

        Route::get('settings/api-tokens', [ApiTokenController::class, 'index'])->name('settings.api-tokens');
        Route::post('settings/api-tokens', [ApiTokenController::class, 'store'])->name('settings.api-tokens.store');
        Route::delete('settings/api-tokens/{token}', [ApiTokenController::class, 'destroy'])->name('settings.api-tokens.destroy');

        Route::get('payroll/salaries', [EmployeeSalaryController::class, 'index'])->name('payroll.salaries');
        Route::post('payroll/salaries', [EmployeeSalaryController::class, 'store'])->name('payroll.salaries.store');
        Route::get('payroll/runs', [PayrollRunController::class, 'index'])->name('payroll.runs');
        Route::post('payroll/runs', [PayrollRunController::class, 'store'])->name('payroll.runs.store');
        Route::get('payroll/runs/{run}', [PayrollRunController::class, 'show'])->name('payroll.runs.show');
        Route::post('payroll/runs/{run}/pay', [PayrollRunController::class, 'pay'])->name('payroll.runs.pay');
        Route::post('payroll/payslips/{payslip}/pay', [PayrollRunController::class, 'payPayslip'])->name('payroll.payslips.pay');
        Route::get('payroll/payslips/{payslip}', [PayslipController::class, 'show'])->name('payroll.payslips.show');
        Route::get('payroll/advances', [SalaryAdvanceController::class, 'index'])->name('payroll.advances');
        Route::post('payroll/advances', [SalaryAdvanceController::class, 'store'])->name('payroll.advances.store');
        Route::post('payroll/advances/{advance}/approve', [SalaryAdvanceController::class, 'approve'])->name('payroll.advances.approve');
        Route::post('payroll/advances/{advance}/reject', [SalaryAdvanceController::class, 'reject'])->name('payroll.advances.reject');
        Route::get('payroll/me', [SalaryAdvanceController::class, 'mine'])->name('payroll.me');

        Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::post('notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
        Route::post('notifications/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');
    });
});

Route::middleware(['auth', 'verified', 'platform'])->prefix('platform')->name('platform.')->group(function () {
    Route::get('/', PlatformDashboardController::class)->name('dashboard');
    Route::get('tenants', [PlatformTenantController::class, 'index'])->name('tenants');
    Route::get('tenants/{tenant}', [PlatformTenantController::class, 'show'])->name('tenants.show');
    Route::patch('tenants/{tenant}/status', [PlatformTenantController::class, 'updateStatus'])->name('tenants.status');
    Route::patch('tenants/{tenant}/plan', [PlatformTenantController::class, 'updatePlan'])->name('tenants.plan');
    Route::patch('tenants/{tenant}/trial', [PlatformTenantController::class, 'extendTrial'])->name('tenants.trial');
    Route::get('plans', [PlatformPlanController::class, 'index'])->name('plans');
    Route::get('plans/create', [PlatformPlanController::class, 'create'])->name('plans.create');
    Route::post('plans', [PlatformPlanController::class, 'store'])->name('plans.store');
    Route::get('plans/{plan}', [PlatformPlanController::class, 'show'])->name('plans.show');
    Route::put('plans/{plan}', [PlatformPlanController::class, 'update'])->name('plans.update');
    Route::delete('plans/{plan}', [PlatformPlanController::class, 'destroy'])->name('plans.destroy');
    Route::get('invoices', [PlatformInvoiceController::class, 'index'])->name('invoices');
    Route::get('invoices/{invoice}', [PlatformInvoiceController::class, 'show'])->name('invoices.show');
    Route::get('invoices/{invoice}/download', [PlatformInvoiceController::class, 'download'])->name('invoices.download');
    Route::get('invoices/{invoice}/print', [PlatformInvoiceController::class, 'print'])->name('invoices.print');
    Route::post('invoices/{invoice}/send', [PlatformInvoiceController::class, 'send'])->name('invoices.send');
    Route::get('payments', [PlatformPaymentController::class, 'index'])->name('payments');
    Route::post('payments/{payment}/complete', [PlatformPaymentController::class, 'complete'])->name('payments.complete');
    Route::get('reports', [PlatformReportController::class, 'index'])->name('reports');
    Route::get('reports/export', [PlatformReportController::class, 'export'])->name('reports.export');
    Route::get('leads', [PlatformLeadController::class, 'index'])->name('leads');
    Route::get('marketing', [PlatformMarketingController::class, 'index'])->name('marketing');
    Route::put('marketing', [PlatformMarketingController::class, 'update'])->name('marketing.update');
    Route::get('gateways', [PlatformGatewaySettingsController::class, 'index'])->name('gateways');
    Route::get('gateways/payments/{gateway}/configure', [PlatformGatewaySettingsController::class, 'configurePayment'])->name('gateways.payments.configure');
    Route::put('gateways/payments/{gateway}', [PlatformGatewaySettingsController::class, 'updatePayment'])->name('gateways.payments.update');
    Route::put('gateways/mail', [PlatformGatewaySettingsController::class, 'updateMail'])->name('gateways.mail');
    Route::put('gateways/sms', [PlatformGatewaySettingsController::class, 'updateSms'])->name('gateways.sms');
    Route::post('gateways/mail/test', [PlatformGatewaySettingsController::class, 'testMail'])->name('gateways.mail.test');
    Route::post('gateways/sms/test', [PlatformGatewaySettingsController::class, 'testSms'])->name('gateways.sms.test');
});

require __DIR__.'/settings.php';
