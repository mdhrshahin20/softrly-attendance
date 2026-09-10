<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('face_templates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->index();
            $table->foreignId('user_id')->index();
            $table->foreignId('employee_id')->nullable()->index();
            // 128-d face descriptor (mean of the enrolment samples).
            $table->json('descriptor');
            $table->unsignedTinyInteger('sample_count')->default(1);
            $table->string('photo_path')->nullable();
            $table->timestamp('enrolled_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'user_id']);
        });

        Schema::table('attendances', function (Blueprint $table): void {
            $table->decimal('check_in_face_score', 6, 4)->nullable();
            $table->timestamp('check_in_face_verified_at')->nullable();
            $table->string('check_in_selfie_path')->nullable();
            $table->decimal('check_out_face_score', 6, 4)->nullable();
            $table->timestamp('check_out_face_verified_at')->nullable();
            $table->string('check_out_selfie_path')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table): void {
            $table->dropColumn([
                'check_in_face_score',
                'check_in_face_verified_at',
                'check_in_selfie_path',
                'check_out_face_score',
                'check_out_face_verified_at',
                'check_out_selfie_path',
            ]);
        });

        Schema::dropIfExists('face_templates');
    }
};
