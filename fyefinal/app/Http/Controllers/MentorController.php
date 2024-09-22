<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class MentorController extends Controller
{
    public function dashboard()
    {
        return view('mentor.dashboard');
    }
}
