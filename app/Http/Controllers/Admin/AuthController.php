<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\PlatformReadinessService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function create(Request $request, PlatformReadinessService $platform): Response|RedirectResponse
    {
        if ($request->user() !== null) {
            if ($platform->isAdmin($request->user())) {
                return redirect()->route('admin.dashboard');
            }

            // Authenticated studio users must not see or probe the admin login.
            abort(404);
        }

        return Inertia::render('admin/login', [
            'status' => $request->session()->get('status'),
        ])->withViewData([
            // Used by app.blade.php when present
        ]);
    }

    public function store(Request $request, PlatformReadinessService $platform): RedirectResponse
    {
        if ($request->user() !== null && ! $platform->isAdmin($request->user())) {
            abort(404);
        }

        $credentials = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $user = User::query()->where('email', $credentials['email'])->first();

        // Same generic error for unknown / wrong password / non-admin (no user enumeration).
        $invalid = ValidationException::withMessages([
            'email' => 'These credentials do not match our records.',
        ]);

        if ($user === null || ! Hash::check($credentials['password'], (string) $user->password)) {
            throw $invalid;
        }

        if ($user->isDisabled() || ! $platform->isAdmin($user)) {
            throw $invalid;
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        return redirect()->intended(route('admin.dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }
}
