const HOST_ATTR = 'data-ui-ripple-host';
const SKIP_ATTR = 'data-ripple';
const TARGET_SELECTOR = [
    'button',
    'a[href]',
    '[role="button"]',
    '[role="menuitem"]',
    '[role="tab"]',
    '[data-slot="button"]',
    '[data-ripple]:not([data-ripple="off"])',
].join(',');

const SKIP_CLOSEST = [
    `[${SKIP_ATTR}="off"]`,
    '[disabled]',
    '[aria-disabled="true"]',
    '[data-no-ripple]',
    '.ui-ripple-layer',
    'input',
    'textarea',
    'select',
    '[contenteditable="true"]',
].join(',');

function prefersReducedMotion(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function isSkipped(node: Element): boolean {
    if (node.closest(SKIP_CLOSEST)) {
        return true;
    }

    if (node instanceof HTMLButtonElement && node.disabled) {
        return true;
    }

    if (node instanceof HTMLAnchorElement && node.hasAttribute('download') === false) {
        // Allow normal anchors; still skip empty javascript: voids if needed
        const href = node.getAttribute('href');
        if (href === '' || href === '#') {
            // still allow ripple for in-page / button-like anchors
        }
    }

    return false;
}

function resolveHost(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof Element)) {
        return null;
    }

    const host = target.closest(TARGET_SELECTOR);
    if (!(host instanceof HTMLElement) || isSkipped(host)) {
        return null;
    }

    return host;
}

function ensureLayer(host: HTMLElement): HTMLElement {
    let layer = host.querySelector(':scope > .ui-ripple-layer') as HTMLElement | null;
    if (!layer) {
        layer = document.createElement('span');
        layer.className = 'ui-ripple-layer';
        layer.setAttribute('aria-hidden', 'true');
        host.appendChild(layer);
    }

    if (!host.hasAttribute(HOST_ATTR)) {
        host.setAttribute(HOST_ATTR, '');
        const position = window.getComputedStyle(host).position;
        if (position === 'static') {
            host.classList.add('ui-ripple-host');
        }
    }

    return layer;
}

function spawnRipple(host: HTMLElement, clientX: number, clientY: number): void {
    if (prefersReducedMotion()) {
        return;
    }

    const rect = host.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) {
        return;
    }

    const layer = ensureLayer(host);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const radius = Math.sqrt(
        Math.max(x, rect.width - x) ** 2 + Math.max(y, rect.height - y) ** 2,
    );
    const size = Math.max(16, radius * 2);

    const ripple = document.createElement('span');
    ripple.className = 'ui-ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;

    layer.appendChild(ripple);

    const cleanup = () => {
        ripple.remove();
        if (layer.childElementCount === 0) {
            layer.remove();
            host.removeAttribute(HOST_ATTR);
        }
    };

    ripple.addEventListener('animationend', cleanup, { once: true });
    window.setTimeout(cleanup, 700);
}

function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType === 'mouse') {
        return;
    }

    const host = resolveHost(event.target);
    if (!host) {
        return;
    }

    spawnRipple(host, event.clientX, event.clientY);
}

function onKeyActivate(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
        return;
    }

    const host = resolveHost(event.target);
    if (!host || event.target !== host) {
        return;
    }

    const rect = host.getBoundingClientRect();
    spawnRipple(host, rect.left + rect.width / 2, rect.top + rect.height / 2);
}

/** Product-wide Material-style ripple for buttons, links, and button-like controls. */
export function installUiRipple(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }

    const root = window as Window & { __uiRippleInstalled?: boolean };
    if (root.__uiRippleInstalled) {
        return;
    }
    root.__uiRippleInstalled = true;

    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('keydown', onKeyActivate);
}
