<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\MentorController;
use App\Http\Controllers\TutorController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;

// Welcome route
Route::get('/', function () {
    return view('welcome');
});

// Group routes for authenticated users
Route::middleware('auth')->group(function () {
    // Profile routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Admin routes (only accessible to admin users)
    Route::middleware([App\Http\Middleware\RoleMiddleware::class . ':admin'])->group(function () {
        Route::get('/admin/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');
        Route::post('/admin/register', [AdminController::class, 'registerUser'])->name('admin.registerUser');
    });

    // Mentor routes (only accessible to mentor users)
    Route::middleware([App\Http\Middleware\RoleMiddleware::class . ':mentor'])->group(function () {
        Route::get('/mentor/dashboard', [MentorController::class, 'dashboard'])->name('mentor.dashboard');
    });

    // Tutor routes (only accessible to tutor users)
    Route::middleware([App\Http\Middleware\RoleMiddleware::class . ':tutor'])->group(function () {
        Route::get('/tutor/dashboard', [TutorController::class, 'dashboard'])->name('tutor.dashboard');
    });

    // Student routes (only accessible to student users)
    Route::middleware([App\Http\Middleware\RoleMiddleware::class . ':student'])->group(function () {
        Route::get('/student/dashboard', [StudentController::class, 'dashboard'])->name('student.dashboard');
    });
});

// Guest routes (for registration, accessible without authentication)
Route::middleware('guest')->group(function () {
    Route::get('/register', [StudentController::class, 'showRegisterForm'])->name('register');
    Route::post('/register', [StudentController::class, 'register'])->name('student.register');
});

// Authentication routes (login, logout, etc.)
require __DIR__.'/auth.php';
