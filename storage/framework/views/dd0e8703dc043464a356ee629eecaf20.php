<?php
    $isAdminPage = str_starts_with((string) ($page['component'] ?? ''), 'admin/');
?>
<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>" class="<?php echo \Illuminate\Support\Arr::toCssClasses(['dark' => ($appearance ?? 'system') == 'dark', 'boot-skeleton-active' => ! $isAdminPage]); ?>">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
        <?php if($isAdminPage): ?>
            <meta name="robots" content="noindex, nofollow, noarchive">
        <?php endif; ?>

        
        <script>
            (function() {
                const appearance = '<?php echo e($appearance ?? 'system'); ?>';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        
        <style>
            html {
                background-color: oklch(0.965 0.014 88);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }

            .boot-wrap {
                box-sizing: border-box;
                width: 100%;
                max-width: 72rem;
                margin: 0 auto;
                padding: 1rem max(1rem, env(safe-area-inset-right)) 2rem max(1rem, env(safe-area-inset-left));
                overflow-x: hidden;
            }

            .boot-nav {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                min-width: 0;
                width: 100%;
                height: 3.5rem;
                overflow: hidden;
            }

            .boot-nav > * {
                min-width: 0;
            }

            .boot-bone {
                box-sizing: border-box;
                max-width: 100%;
                border-radius: 0.85rem;
                background: color-mix(in oklab, #8d6b3e 12%, transparent);
            }

            .boot-bone-dark {
                background: rgba(255, 255, 255, 0.12) !important;
            }

            /* Responsive helpers for first-paint skeletons */
            .boot-hide-sm { display: none !important; }
            .boot-only-sm { display: block !important; }
            .boot-grid-2 {
                display: grid;
                gap: 1rem;
                grid-template-columns: 1fr;
            }
            .boot-grid-hero {
                display: grid;
                gap: 1.5rem;
                grid-template-columns: 1fr;
                align-items: start;
            }
            .boot-grid-side {
                display: grid;
                gap: 1rem;
                grid-template-columns: 1fr;
            }
            .boot-editor-desktop { display: none !important; }
            .boot-editor-mobile { display: flex !important; }

            @media (min-width: 640px) {
                .boot-hide-sm { display: block !important; }
                .boot-only-sm { display: none !important; }
                .boot-grid-2 { grid-template-columns: 1fr 1fr; }
            }

            @media (min-width: 768px) {
                .boot-editor-desktop { display: grid !important; }
                .boot-editor-mobile { display: none !important; }
            }

            .boot-settings-nav {
                display: flex;
                flex-direction: row;
                gap: 0.5rem;
                padding: 0.5rem;
                border-radius: 1rem;
                background: color-mix(in oklab, white 80%, transparent);
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
            }

            @media (min-width: 1024px) {
                .boot-grid-hero { grid-template-columns: 1.15fr 0.85fr; gap: 2.5rem; }
                .boot-grid-side { grid-template-columns: minmax(0, 1fr) min(16rem, 32%); }
                .boot-grid-side-wide { grid-template-columns: 13rem minmax(0, 1fr); }
                .boot-grid-dash { grid-template-columns: 1.2fr 0.8fr; }
                .boot-auth-layout { grid-template-columns: 1.05fr 0.95fr !important; }
                .boot-auth-aside { display: block !important; }
                .boot-settings-nav {
                    flex-direction: column;
                    overflow: visible;
                }
            }

            @media (prefers-reduced-motion: no-preference) {
                .boot-bone {
                    background-image: linear-gradient(
                        105deg,
                        color-mix(in oklab, #8d6b3e 10%, transparent) 0%,
                        color-mix(in oklab, #8d6b3e 10%, transparent) 38%,
                        color-mix(in oklab, #8d6b3e 26%, white) 50%,
                        color-mix(in oklab, #8d6b3e 10%, transparent) 62%,
                        color-mix(in oklab, #8d6b3e 10%, transparent) 100%
                    );
                    background-size: 220% 100%;
                    animation: boot-shimmer 1.35s ease-in-out infinite;
                }

                .boot-bone-dark {
                    background-image: linear-gradient(
                        105deg,
                        rgba(255, 255, 255, 0.08) 0%,
                        rgba(255, 255, 255, 0.08) 38%,
                        rgba(255, 255, 255, 0.22) 50%,
                        rgba(255, 255, 255, 0.08) 62%,
                        rgba(255, 255, 255, 0.08) 100%
                    ) !important;
                }
            }

            @keyframes boot-shimmer {
                0% { background-position: 120% 0; }
                100% { background-position: -120% 0; }
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/brand/evitely-mark.jpg">
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png">
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png">
        <link rel="manifest" href="/manifest.webmanifest">
        <meta name="theme-color" content="#18181b">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-title" content="Evitely">

        <?php echo app('Illuminate\Foundation\Vite')->fonts(); ?>

        <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
        <?php echo app('Illuminate\Foundation\Vite')(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"]); ?>
        <?php if (isset($component)) { $__componentOriginal56673881198e3a2924721e242dee6899 = $component; } ?>
<?php if (isset($attributes)) { $__attributesOriginal56673881198e3a2924721e242dee6899 = $attributes; } ?>
<?php $component = Inertia\View\Components\Head::resolve([] + (isset($attributes) && $attributes instanceof Illuminate\View\ComponentAttributeBag ? $attributes->all() : [])); ?>
<?php $component->withName('inertia::head'); ?>
<?php if ($component->shouldRender()): ?>
<?php $__env->startComponent($component->resolveView(), $component->data()); ?>
<?php if (isset($attributes) && $attributes instanceof Illuminate\View\ComponentAttributeBag): ?>
<?php $attributes = $attributes->except(\Inertia\View\Components\Head::ignoredParameterNames()); ?>
<?php endif; ?>
<?php $component->withAttributes([]); ?>
            <title><?php echo e(config('app.name', 'Evitely')); ?></title>
         <?php echo $__env->renderComponent(); ?>
<?php endif; ?>
<?php if (isset($__attributesOriginal56673881198e3a2924721e242dee6899)): ?>
<?php $attributes = $__attributesOriginal56673881198e3a2924721e242dee6899; ?>
<?php unset($__attributesOriginal56673881198e3a2924721e242dee6899); ?>
<?php endif; ?>
<?php if (isset($__componentOriginal56673881198e3a2924721e242dee6899)): ?>
<?php $component = $__componentOriginal56673881198e3a2924721e242dee6899; ?>
<?php unset($__componentOriginal56673881198e3a2924721e242dee6899); ?>
<?php endif; ?>
    </head>
    <body class="font-sans antialiased">
        
        <?php if (! ($isAdminPage)): ?>
            <?php echo $__env->make('partials.boot-skeleton', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
        <?php endif; ?>
        <?php if (isset($component)) { $__componentOriginal1830bdc8f8b965a5838ec47487b5507c = $component; } ?>
<?php if (isset($attributes)) { $__attributesOriginal1830bdc8f8b965a5838ec47487b5507c = $attributes; } ?>
<?php $component = Inertia\View\Components\App::resolve([] + (isset($attributes) && $attributes instanceof Illuminate\View\ComponentAttributeBag ? $attributes->all() : [])); ?>
<?php $component->withName('inertia::app'); ?>
<?php if ($component->shouldRender()): ?>
<?php $__env->startComponent($component->resolveView(), $component->data()); ?>
<?php if (isset($attributes) && $attributes instanceof Illuminate\View\ComponentAttributeBag): ?>
<?php $attributes = $attributes->except(\Inertia\View\Components\App::ignoredParameterNames()); ?>
<?php endif; ?>
<?php $component->withAttributes([]); ?>
<?php echo $__env->renderComponent(); ?>
<?php endif; ?>
<?php if (isset($__attributesOriginal1830bdc8f8b965a5838ec47487b5507c)): ?>
<?php $attributes = $__attributesOriginal1830bdc8f8b965a5838ec47487b5507c; ?>
<?php unset($__attributesOriginal1830bdc8f8b965a5838ec47487b5507c); ?>
<?php endif; ?>
<?php if (isset($__componentOriginal1830bdc8f8b965a5838ec47487b5507c)): ?>
<?php $component = $__componentOriginal1830bdc8f8b965a5838ec47487b5507c; ?>
<?php unset($__componentOriginal1830bdc8f8b965a5838ec47487b5507c); ?>
<?php endif; ?>
    </body>
</html>
<?php /**PATH C:\Users\Abcom\Sites\wedding-invitation\resources\views/app.blade.php ENDPATH**/ ?>