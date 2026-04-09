<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/about', function () {
    return view('pages_about');
});

Route::get('/terms', function () {
    return view('pages_terms');
});

// Use fallback for session slugs (exactly 8 alphanumeric characters)
Route::fallback(function ($slug = null) {
    // If we have an 8-char slug, show welcome (the join view)
    if (preg_match('/^[a-zA-Z0-9]{8}$/', request()->path())) {
        return view('welcome');
    }
    
    // Otherwise, standard 404
    abort(404);
});
