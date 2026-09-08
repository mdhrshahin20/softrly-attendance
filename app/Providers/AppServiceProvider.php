<?php

namespace App\Providers;

use App\Domain\Attendance\Models\Attendance;
use App\Domain\Billing\Contracts\PaymentGateway;
use App\Domain\Billing\Events\PaymentCompleted;
use App\Domain\Billing\Events\SubscriptionExpired;
use App\Domain\Billing\Events\SubscriptionStarted;
use App\Domain\Billing\Listeners\HandlePaymentCompleted;
use App\Domain\Billing\Listeners\HandleSubscriptionMail;
use App\Domain\Billing\Services\PaymentGatewayManager;
use App\Domain\Employee\Models\Employee;
use App\Domain\Holiday\Models\Holiday;
use App\Domain\Leave\Models\LeaveRequest;
use App\Domain\Leave\Models\LeaveType;
use App\Domain\Payroll\Models\Payslip;
use App\Domain\Platform\Services\PlatformSettingsService;
use App\Domain\Tenant\Services\AuditLogger;
use App\Models\User;
use App\Policies\AttendancePolicy;
use App\Policies\EmployeePolicy;
use App\Policies\HolidayPolicy;
use App\Policies\LeaveRequestPolicy;
use App\Policies\LeaveTypePolicy;
use App\Policies\PayrollPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(PlatformSettingsService::class);
        $this->app->singleton(PaymentGatewayManager::class);
        $this->app->bind(PaymentGateway::class, fn ($app): PaymentGateway => $app->make(PaymentGatewayManager::class)->driver());
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        Gate::policy(Employee::class, EmployeePolicy::class);
        Gate::policy(Attendance::class, AttendancePolicy::class);
        Gate::policy(LeaveRequest::class, LeaveRequestPolicy::class);
        Gate::policy(LeaveType::class, LeaveTypePolicy::class);
        Gate::policy(Holiday::class, HolidayPolicy::class);
        Gate::policy(Payslip::class, PayrollPolicy::class);

        Event::listen(Login::class, function (Login $event): void {
            $user = $event->user;

            if (! $user instanceof User) {
                return;
            }

            app(AuditLogger::class)->record('auth.login', $user, newValues: [
                'email' => $user->email,
            ], user: $user);
        });

        Event::listen(PaymentCompleted::class, HandlePaymentCompleted::class);
        Event::listen(SubscriptionStarted::class, [HandleSubscriptionMail::class, 'started']);
        Event::listen(SubscriptionExpired::class, [HandleSubscriptionMail::class, 'expired']);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
