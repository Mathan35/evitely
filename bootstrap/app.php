<?php

use App\Http\Middleware\EnsurePlatformAdmin;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            Route::middleware('web')
                ->group(base_path('routes/admin.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->validateCsrfTokens(except: [
            'stripe/*',
            'razorpay/*',
        ]);

        $middleware->alias([
            'platform.admin' => EnsurePlatformAdmin::class,
        ]);

        $middleware->redirectGuestsTo(function (Request $request): string {
            if ($request->is('admin') || $request->is('admin/*')) {
                return route('admin.login');
            }

            return route('login');
        });

        // Intentionally omit AddLinkHeadersForPreloadedAssets: Vite font
        // preloads emit a ~10KB Link header that Herd/nginx rejects as
        // "upstream sent too big header" (500/502 on *.test).
        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Optional Sentry — only when the package is installed and a DSN is set.
        if (filled(config('services.sentry.dsn')) && class_exists(\Sentry\Laravel\Integration::class)) {
            $exceptions->reportable(function (Throwable $e): void {
                \Sentry\Laravel\Integration::captureUnhandledException($e);
            });
        }

        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            $status = $response->getStatusCode();

            if (! in_array($status, [403, 404, 419, 500, 503], true)) {
                return $response;
            }

            if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                return $response;
            }

            if (app()->runningUnitTests() && ! $request->header('X-Inertia')) {
                return $response;
            }

            return Inertia::render('errors/show', [
                'status' => $status,
            ])->toResponse($request)->setStatusCode($status);
        });
    })->create();
