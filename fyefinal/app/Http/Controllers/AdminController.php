<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class AdminController extends Controller
{
    public function dashboard()
    {
        return view('admin.dashboard');
    }

    public function registerUser(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:mentor,tutor',
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'role' => $validated['role'],
        ]);

         // Raw password
            $rawPassword = $request->password;

            // Prepare the success message
            $successMessage = "User registered successfully! Details: Name: {$request->name}, Email: {$request->email}, Password: {$rawPassword}";

            // Redirect with the success message
            return redirect()->route('admin.dashboard')->with('success', $successMessage);
    }
}
