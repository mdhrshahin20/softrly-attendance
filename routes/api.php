<?php

use App\Http\Controllers\Api\V1\AttendanceController;
use App\Http\Controllers\Api\V1\LeaveController;
use App\Http\Controllers\Api\V1\MeController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['api.token', 'subscription.active'])->group(function () {
    Route::get('me', MeController::class);
    Route::get('attendance/today', [AttendanceController::class, 'today']);
    Route::post('attendance/check-in', [AttendanceController::class, 'checkIn'])->middleware('active.employee');
    Route::post('attendance/check-out', [AttendanceController::class, 'checkOut'])->middleware('active.employee');
    Route::get('leave', [LeaveController::class, 'index']);
    Route::post('leave', [LeaveController::class, 'store']);
});
