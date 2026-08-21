<?php

use App\Http\Controllers\Api\InquiryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PromoController;
use App\Http\Controllers\Api\StatsController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(
    [
    'ok' => true,
    'data' => 'Mxmobilz API is running'
    ]

    ));

Route::apiResource('products', ProductController::class);

Route::get('orders', [OrderController::class, 'index']);
Route::post('orders', [OrderController::class, 'store']);
Route::patch('orders/{order}', [OrderController::class, 'update']);

Route::get('inquiries', [InquiryController::class, 'index']);
Route::post('inquiries', [InquiryController::class, 'store']);
Route::patch('inquiries/{inquiry}', [InquiryController::class, 'update']);
Route::delete('inquiries/{inquiry}', [InquiryController::class, 'destroy']);

Route::apiResource('promos', PromoController::class);

Route::get('stats', [StatsController::class, 'index']);
