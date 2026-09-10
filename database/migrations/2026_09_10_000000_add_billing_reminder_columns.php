<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table): void {
            $table->timestamp('trial_reminder_sent_at')->nullable();
            $table->timestamp('renewal_reminder_sent_at')->nullable();
        });

        Schema::table('invoices', function (Blueprint $table): void {
            $table->timestamp('due_reminder_sent_at')->nullable();
            $table->timestamp('overdue_reminder_sent_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table): void {
            $table->dropColumn(['trial_reminder_sent_at', 'renewal_reminder_sent_at']);
        });

        Schema::table('invoices', function (Blueprint $table): void {
            $table->dropColumn(['due_reminder_sent_at', 'overdue_reminder_sent_at']);
        });
    }
};
