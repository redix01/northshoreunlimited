<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\BrokerRequestController;
use App\Http\Controllers\ConsultationBookingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepositController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TradeRequestController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\WithdrawalController;
use App\Http\Controllers\Admin;
use Illuminate\Support\Facades\Route;

// ─── Public / Marketing ────────────────────────────────────────────────────
Route::inertia('/', 'Home')->name('home');
Route::inertia('/company', 'Company')->name('company');
Route::inertia('/guide', 'Guide')->name('guide');
Route::inertia('/compliance', 'Compliance')->name('compliance');
Route::inertia('/terms', 'Terms')->name('terms');
Route::get('/schedule', [ConsultationBookingController::class, 'show'])->name('schedule');
Route::post('/schedule', [ConsultationBookingController::class, 'store'])->name('schedule.store');
Route::post('/trade-request', [TradeRequestController::class, 'store'])->name('trade-requests.store');

// ─── Authentication ────────────────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/portal', [LoginController::class, 'show'])->name('portal');
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->name('login.store');
});

Route::post('/logout', [LoginController::class, 'destroy'])->name('logout')->middleware('auth');

// ─── User Dashboard ────────────────────────────────────────────────────────
Route::redirect('/dashboard', '/user/dashboard')->middleware('auth');
Route::redirect('/dashboard/deposits', '/user/deposits')->middleware('auth');
Route::redirect('/dashboard/withdrawals', '/user/withdrawals')->middleware('auth');
Route::redirect('/dashboard/profile', '/user/profile')->middleware('auth');

Route::middleware(['auth', 'user'])->prefix('user')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/wallet', [WalletController::class, 'index'])->name('wallet.index');

    Route::get('/deposits', [DepositController::class, 'index'])->name('deposits.index');
    Route::post('/deposits', [DepositController::class, 'store'])->name('deposits.store');

    Route::get('/withdrawals', [WithdrawalController::class, 'index'])->name('withdrawals.index');
    Route::post('/withdrawals', [WithdrawalController::class, 'store'])->name('withdrawals.store');

    Route::post('/broker-requests', [BrokerRequestController::class, 'store'])->name('broker-requests.store');

    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    // POST, not PUT: the profile form carries an avatar upload, and multipart
    // bodies do not survive a method-spoofed PUT.
    Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('/profile/settings', [ProfileController::class, 'updateSettings'])->name('profile.settings');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    Route::post('/documents', [DocumentController::class, 'store'])->name('documents.store');
    Route::get('/documents/{document}', [DocumentController::class, 'show'])->name('documents.show');
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');
});

// ─── Admin Dashboard ───────────────────────────────────────────────────────
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    Route::redirect('/', '/admin/dashboard');
    Route::get('/dashboard', [Admin\DashboardController::class, 'index'])->name('admin.dashboard');

    Route::get('/users', [Admin\UserController::class, 'index'])->name('admin.users');
    Route::post('/users', [Admin\UserController::class, 'store'])->name('admin.users.store');
    Route::get('/users/{user}', [Admin\UserController::class, 'show'])->name('admin.users.show');
    Route::put('/users/{user}', [Admin\UserController::class, 'update'])->name('admin.users.update');
    Route::post('/users/{user}/add-funds', [Admin\UserController::class, 'addFunds'])->name('admin.users.add-funds');

    Route::get('/wallets', [Admin\WalletController::class, 'index'])->name('admin.wallets');
    Route::post('/wallets', [Admin\WalletController::class, 'store'])->name('admin.wallets.store');
    Route::put('/wallets/{wallet}', [Admin\WalletController::class, 'update'])->name('admin.wallets.update');

    Route::get('/deposits', [Admin\DepositController::class, 'index'])->name('admin.deposits');
    Route::post('/deposits/{deposit}/approve', [Admin\DepositController::class, 'approve'])->name('admin.deposits.approve');
    Route::post('/deposits/{deposit}/reject', [Admin\DepositController::class, 'reject'])->name('admin.deposits.reject');

    Route::get('/withdrawals', [Admin\WithdrawalController::class, 'index'])->name('admin.withdrawals');
    Route::post('/withdrawals/{withdrawal}/approve', [Admin\WithdrawalController::class, 'approve'])->name('admin.withdrawals.approve');
    Route::post('/withdrawals/{withdrawal}/reject', [Admin\WithdrawalController::class, 'reject'])->name('admin.withdrawals.reject');
});
