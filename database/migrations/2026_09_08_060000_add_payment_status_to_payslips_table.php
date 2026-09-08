<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->string('status')->default('unpaid')->after('net');
            $table->timestamp('paid_at')->nullable()->after('status');
        });

        $paidRunIds = DB::table('payroll_runs')->where('status', 'paid')->pluck('id');

        if ($paidRunIds->isNotEmpty()) {
            DB::table('payslips')
                ->whereIn('payroll_run_id', $paidRunIds)
                ->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->dropColumn(['status', 'paid_at']);
        });
    }
};
