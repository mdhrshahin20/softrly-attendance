<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('backups', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('type');
            $table->foreignId('tenant_id')->nullable()->index();
            $table->string('status')->default('pending');
            $table->string('filename');
            $table->string('path');
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->unsignedInteger('table_count')->default(0);
            $table->unsignedBigInteger('row_count')->default(0);
            $table->unsignedBigInteger('file_count')->default(0);
            $table->text('error')->nullable();
            $table->foreignId('created_by')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backups');
    }
};
