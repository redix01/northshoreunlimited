import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'portal-theme';

/*
 * A module-level store rather than per-component state: the header toggle and
 * the Settings switch on the profile screen must stay in step.
 */
let current: Theme = 'light';
let initialised = false;
const listeners = new Set<() => void>();

function preferred(): Theme {
    if (typeof window === 'undefined') return 'light';

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(theme: Theme) {
    current = theme;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
    listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
    if (!initialised) {
        initialised = true;
        apply(preferred());
    }

    listeners.add(listener);
    return () => listeners.delete(listener);
}

/**
 * Portal light/dark theme. The choice is written to `data-theme` on <html> so
 * the CSS custom properties in app.css switch for the whole document.
 */
export function useTheme() {
    const theme = useSyncExternalStore(
        subscribe,
        () => current,
        () => 'light' as Theme,
    );

    const setTheme = useCallback((next: Theme) => apply(next), []);
    const toggle = useCallback(() => apply(current === 'dark' ? 'light' : 'dark'), []);

    return { theme, setTheme, toggle };
}
