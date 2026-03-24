export async function register() {
    if (process.env.NODE_ENV === 'development') {
        if (typeof global !== 'undefined') {
            try {
                // Safe check for localStorage existence
                const hasLocalStorage = 'localStorage' in global;

                if (hasLocalStorage) {
                    // If it exists, check if it's broken
                    try {
                        // @ts-ignore
                        const getItem = global.localStorage?.getItem;
                        if (typeof getItem !== 'function') {
                            throw new Error('Broken localStorage detected');
                        }
                    } catch (e) {
                        console.warn('Patching broken global.localStorage in instrumentation');
                        // Replace broken implementation with no-op
                        Object.defineProperty(global, 'localStorage', {
                            value: {
                                getItem: () => null,
                                setItem: () => { },
                                removeItem: () => { },
                                clear: () => { },
                                key: () => null,
                                length: 0,
                            },
                            configurable: true,
                            writable: true
                        });
                    }
                } else {
                    // If it doesn't exist, we can optionally define it, but usually not needed for server unless code expects it
                }
            } catch (e) {
                // Ignore errors
            }
        }
    }
}
