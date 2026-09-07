<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code');
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->default('BD');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->unsignedInteger('allowed_radius')->default(200);
            $table->string('timezone')->default('Asia/Dhaka');
            $table->string('status')->default('active');
            $table->timestamps();

            $table->unique(['tenant_id', 'code']);
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('office_networks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('office_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('ip_address')->nullable();
            $table->string('ip_range')->nullable();
            $table->string('network_type')->default('static_ip');
            $table->string('status')->default('active');
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'ip_address']);
        });

        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code');
            $table->foreignId('manager_id')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();

            $table->unique(['tenant_id', 'code']);
        });

        Schema::create('designations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('active');
            $table->timestamps();

            $table->index(['tenant_id', 'department_id']);
        });

        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedInteger('grace_minutes')->default(10);
            $table->unsignedInteger('minimum_work_minutes')->default(480);
            $table->string('status')->default('active');
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
        });

        Schema::create('working_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week');
            $table->boolean('is_working')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('working_days');
        Schema::dropIfExists('shifts');
        Schema::dropIfExists('designations');
        Schema::dropIfExists('departments');
        Schema::dropIfExists('office_networks');
        Schema::dropIfExists('offices');
    }
};
