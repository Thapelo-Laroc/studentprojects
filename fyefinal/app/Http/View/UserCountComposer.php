<?php

namespace App\Http\View;

use Illuminate\View\View;
use App\Models\User;

class UserCountComposer
{
    public function compose(View $view)
    {
        $view->with([
            'studentCount' => User::where('role', 'student')->count(),
            'tutorCount' => User::where('role', 'tutor')->count(),
            'mentorCount' => User::where('role', 'mentor')->count(),
        ]);
    }
}
