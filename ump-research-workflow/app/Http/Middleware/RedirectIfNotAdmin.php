<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfNotAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    // RedirectIfNotAdmin.php
    public function handle($request, Closure $next)
    {
        if (!auth()->check() || !auth()->user()->hasRole('admin')) {
            return redirect('/login');
        }
        return $next($request);
    }
}
