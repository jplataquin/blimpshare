<?php

use App\Http\Controllers\SessionController;
use Illuminate\Support\Facades\Route;

Route::post('/sessions', [SessionController::class, 'create']);
Route::post('/sessions/{slug}/join', [SessionController::class, 'join']);
Route::post('/sessions/{slug}/messages', [SessionController::class, 'sendMessage']);
Route::get('/sessions/{slug}/messages', [SessionController::class, 'getMessages']);
