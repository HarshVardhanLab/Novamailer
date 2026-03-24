"use client";

if (typeof window !== 'undefined') {
    try {
        // Check if localStorage exists but is broken (getItem is not a function)
        if (window.localStorage && typeof window.localStorage.getItem !== 'function') {
            console.warn('Detected broken localStorage (getItem is not a function). Patching with no-op implementation.');

            const noopStorage = {
                getItem: () => null,
                setItem: () => { },
                removeItem: () => { },
                clear: () => { },
                key: () => null,
                length: 0,
            } as Storage;

            Object.defineProperty(window, 'localStorage', {
                value: noopStorage,
                configurable: true,
                writable: true
            });
        }
    } catch (e) {
        console.error('Failed to patch localStorage:', e);
    }
}
