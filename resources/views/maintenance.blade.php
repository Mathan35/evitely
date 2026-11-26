<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    @if ($refresh ?? false)
        <meta http-equiv="refresh" content="{{ (int) $refresh }}">
    @endif
    <title>{{ config('app.name', 'Invidora') }} — Updating</title>
    <link rel="icon" href="/favicon.ico" sizes="any">
    <style>
        :root {
            color-scheme: light dark;
            --bg0: #f4f0ea;
            --bg1: #ebe4da;
            --ink: #1c1712;
            --muted: #6b6258;
            --card: rgba(255, 255, 255, 0.78);
            --ring: rgba(28, 23, 18, 0.08);
            --accent: #c6a36a;
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --bg0: #0c0b0a;
                --bg1: #161412;
                --ink: #f6f1e8;
                --muted: #a89f93;
                --card: rgba(22, 20, 18, 0.78);
                --ring: rgba(255, 255, 255, 0.1);
                --accent: #d4b57a;
            }
        }
        * { box-sizing: border-box; }
        html, body { height: 100%; margin: 0; }
        body {
            min-height: 100%;
            display: grid;
            place-items: center;
            padding: 1.5rem;
            font-family: "Segoe UI", ui-sans-serif, system-ui, -apple-system, sans-serif;
            color: var(--ink);
            background:
                radial-gradient(ellipse 80% 60% at 50% -10%, rgba(198, 163, 106, 0.22), transparent 55%),
                linear-gradient(165deg, var(--bg0), var(--bg1));
        }
        .card {
            width: min(100%, 26rem);
            padding: 2rem 1.75rem 1.75rem;
            text-align: center;
            border-radius: 1.75rem;
            background: var(--card);
            border: 1px solid var(--ring);
            box-shadow: 0 24px 60px -36px rgba(28, 23, 18, 0.45);
            backdrop-filter: blur(16px);
        }
        .mark {
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
            font-size: 1.05rem;
            font-weight: 650;
            letter-spacing: -0.02em;
        }
        .mark-dot {
            width: 0.7rem;
            height: 0.7rem;
            border-radius: 999px;
            background: var(--accent);
            box-shadow: 0 0 0 4px rgba(198, 163, 106, 0.22);
            animation: pulse 1.6s ease-in-out infinite;
        }
        h1 {
            margin: 1.35rem 0 0;
            font-family: Georgia, "Times New Roman", serif;
            font-size: clamp(1.85rem, 5vw, 2.35rem);
            font-weight: 500;
            letter-spacing: -0.03em;
            line-height: 1.15;
        }
        p {
            margin: 0.85rem 0 0;
            color: var(--muted);
            font-size: 0.98rem;
            line-height: 1.6;
        }
        .bar {
            margin: 1.6rem auto 0;
            width: min(100%, 12rem);
            height: 0.28rem;
            overflow: hidden;
            border-radius: 999px;
            background: rgba(198, 163, 106, 0.18);
        }
        .bar > span {
            display: block;
            width: 42%;
            height: 100%;
            border-radius: inherit;
            background: var(--accent);
            animation: slide 1.4s ease-in-out infinite;
        }
        .hint {
            margin-top: 1.25rem;
            font-size: 0.78rem;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: var(--muted);
            opacity: 0.85;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(0.86); opacity: 0.7; }
        }
        @keyframes slide {
            0% { transform: translateX(-30%); }
            100% { transform: translateX(180%); }
        }
        @media (prefers-reduced-motion: reduce) {
            .mark-dot, .bar > span { animation: none; }
        }
    </style>
</head>
<body>
    <main class="card" role="status" aria-live="polite">
        <div class="mark">
            <span class="mark-dot" aria-hidden="true"></span>
            <span>{{ config('app.name', 'Invidora') }}</span>
        </div>
        <h1>We’re updating things</h1>
        <p>
            A quick refresh is in progress. This page will reload automatically —
            usually in under a minute.
        </p>
        <div class="bar" aria-hidden="true"><span></span></div>
        <p class="hint">Please keep this tab open</p>
    </main>
    <script>
        (function () {
            var seconds = {{ (int) ($refresh ?? 12) }};
            if (!seconds || seconds < 3) seconds = 12;
            setTimeout(function () {
                window.location.reload();
            }, seconds * 1000);
        })();
    </script>
</body>
</html>
