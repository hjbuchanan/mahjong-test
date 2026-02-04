<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('mahjong');
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('mahjong', function () {
    return Inertia::render('mahjong');
})->name('mahjong');

require __DIR__.'/settings.php';
