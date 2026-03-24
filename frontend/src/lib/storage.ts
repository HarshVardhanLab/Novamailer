/**
 * Safely access localStorage with proper checks for SSR compatibility
 */

export const safeLocalStorage = {
    getItem: (key: string): string | null => {
        if (
            typeof window !== 'undefined' &&
            typeof window.localStorage !== 'undefined' &&
            typeof window.localStorage.getItem === 'function'
        ) {
            try {
                return window.localStorage.getItem(key);
            } catch (error) {
                console.error('Error accessing localStorage:', error);
                return null;
            }
        }
        return null;
    },

    setItem: (key: string, value: string): boolean => {
        if (
            typeof window !== 'undefined' &&
            typeof window.localStorage !== 'undefined' &&
            typeof window.localStorage.setItem === 'function'
        ) {
            try {
                window.localStorage.setItem(key, value);
                return true;
            } catch (error) {
                console.error('Error setting localStorage:', error);
                return false;
            }
        }
        return false;
    },

    removeItem: (key: string): boolean => {
        if (
            typeof window !== 'undefined' &&
            typeof window.localStorage !== 'undefined' &&
            typeof window.localStorage.removeItem === 'function'
        ) {
            try {
                window.localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Error removing from localStorage:', error);
                return false;
            }
        }
        return false;
    },
};
