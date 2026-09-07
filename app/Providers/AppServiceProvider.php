<?php

namespace App\Providers;

use App\Domain\Attendance\Models\Attendance;
use App\Domain\Billing\Contracts\PaymentGateway;
use App\Domain\Billing\Gateways\ManualPaymentGateway;
use App\Domain\Employee\Models\Employee;
use App\Domain\Holiday\Models\Holiday;
use App\Domain\Leave\Models\LeaveRequest;
use App\Domain\Leave\Models\LeaveType;
use App\Domain\Tenant\Services\AuditLogger;
use App\Models\User;
use App\Policies\AttendancePolicy;
use App\Policies\EmployeePolicy;
use App\Policies\HolidayPolicy;
use App\Policies\LeaveRequestPolicy;
use App\Policies\LeaveTypePolicy;
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
        $this->app->bind(PaymentGateway::class, ManualPaymentGateway::class);
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

        Event::listen(Login::class, function (Login $event): void {
            $user = $event->user;

            if (! $user instanceof User) {
                return;
            }

            app(AuditLogger::class)->record('auth.login', $user, newValues: [
                'email' => $user->email,
            ], user: $user);
        });
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
