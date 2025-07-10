/**
 * Environment configuration utilities
 * 
 * Handles environment variables and configuration for different environments
 */

/**
 * Check if we're in development mode
 */
export const isDevelopment = import.meta.env.DEV

/**
 * Check if we're in production mode
 */
export const isProduction = import.meta.env.PROD

/**
 * Get the current environment mode
 */
export const mode = import.meta.env.MODE

/**
 * Get base URL for the application
 */
export const baseUrl = import.meta.env.BASE_URL

/**
 * Environment configuration object
 */
export const config = {
    // App metadata
    app: {
        name: import.meta.env.VITE_APP_NAME || 'React App',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    },

    // Development configuration
    dev: {
        port: Number(import.meta.env.VITE_DEV_PORT) || 5173,
        host: import.meta.env.VITE_DEV_HOST || 'localhost',
        enableDevTools: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true' || isDevelopment,
        enableStrictMode: import.meta.env.VITE_ENABLE_STRICT_MODE === 'true' || isDevelopment,
    },

    // API configuration (optional - only if you have a backend)
    api: {
        baseUrl: import.meta.env.VITE_API_BASE_URL || '',
        timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 5000,
    },

    // Playwright configuration
    playwright: {
        browser: import.meta.env.PLAYWRIGHT_BROWSER || 'chromium',
        headless: import.meta.env.PLAYWRIGHT_HEADLESS !== 'false',
    },

    // Environment info
    env: {
        isDevelopment,
        isProduction,
        mode,
        baseUrl,
    },
} as const

/**
 * Type-safe environment variable getter
 * @param key - The environment variable key
 * @param defaultValue - Default value if the key doesn't exist
 * @returns The environment variable value or default
 * @example
 * const apiUrl = getEnvVar('VITE_API_URL', 'http://localhost:3000')
 */
export function getEnvVar(key: string, defaultValue: string = ''): string {
    return import.meta.env[key] || defaultValue
}

/**
 * Validate required environment variables
 * @param requiredVars - Array of required environment variable names
 * @throws Error if any required variables are missing
 * @example
 * validateEnvVars(['VITE_API_URL', 'VITE_AUTH_DOMAIN'])
 */
export function validateEnvVars(requiredVars: string[]): void {
    const missing = requiredVars.filter(varName => !import.meta.env[varName])

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}\n` +
            'Please check your .env file or environment configuration.'
        )
    }
}

/**
 * Development-only logger
 * @param message - The message to log
 * @param data - Optional data to log
 * @example
 * devLog('User logged in', { userId: 123 })
 */
export function devLog(message: string, data?: unknown): void {
    if (isDevelopment || config.dev.enableDevTools) {
        console.log(`[DEV] ${message}`, data || '')
    }
}

/**
 * Environment-specific class names helper
 * @param base - Base class names
 * @param dev - Development-only class names
 * @param prod - Production-only class names
 * @returns Combined class names based on environment
 * @example
 * const classes = envClasses('bg-white', 'border-red-500', 'shadow-lg')
 */
export function envClasses(
    base: string,
    dev: string = '',
    prod: string = ''
): string {
    const envSpecific = isDevelopment ? dev : prod
    return [base, envSpecific].filter(Boolean).join(' ')
}
