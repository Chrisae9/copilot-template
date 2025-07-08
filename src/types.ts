/**
 * Global type definitions for the application
 * 
 * This file contains shared types, interfaces, and type utilities
 * used throughout the application.
 */

// ============================================================================
// Common Types
// ============================================================================

/**
 * Generic API response wrapper
 * @template T - The type of the data payload
 */
export interface ApiResponse<T = unknown> {
    data: T
    message: string
    success: boolean
    timestamp: string
}

/**
 * Generic error response from API
 */
export interface ApiError {
    message: string
    code: string
    details?: Record<string, string[]>
}

/**
 * Loading states for async operations
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

/**
 * Generic async state for hooks and components
 * @template T - The type of the data being loaded
 * @template E - The type of error (defaults to string)
 */
export interface AsyncState<T, E = string> {
    data: T | null
    loading: boolean
    error: E | null
    state: LoadingState
}

// ============================================================================
// Component Props
// ============================================================================

/**
 * Common props for components that can be styled
 */
export interface StyleProps {
    className?: string
    style?: React.CSSProperties
}

/**
 * Props for components that can have children
 */
export interface ChildrenProps {
    children: React.ReactNode
}

/**
 * Common size variants for UI components
 */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * Common color variants for UI components
 */
export type ColorVariant =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'

// ============================================================================
// Form Types
// ============================================================================

/**
 * Generic form field props
 */
export interface FormFieldProps {
    name: string
    label?: string
    error?: string
    required?: boolean
    disabled?: boolean
    placeholder?: string
}

/**
 * Form validation error structure
 */
export interface ValidationError {
    field: string
    message: string
}

// ============================================================================
// Navigation Types
// ============================================================================

/**
 * Route configuration for navigation
 */
export interface Route {
    path: string
    label: string
    icon?: string
    exact?: boolean
    protected?: boolean
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Extract the return type of a function
 */
export type ReturnTypeOf<T extends (...args: any[]) => any> = T extends (
    ...args: any[]
) => infer R
    ? R
    : never

/**
 * Create a type that omits specified keys and makes remaining keys optional
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

/**
 * Create a type with all properties required except specified keys
 */
export type RequiredExcept<T, K extends keyof T> = Required<T> & Partial<Pick<T, K>>

// ============================================================================
// Event Types
// ============================================================================

/**
 * Common event handler types
 */
export type ClickHandler = (event: React.MouseEvent<HTMLElement>) => void
export type ChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void
export type SubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void
export type KeyHandler = (event: React.KeyboardEvent<HTMLElement>) => void

// ============================================================================
// Theme Types (if using theme system)
// ============================================================================

/**
 * Theme mode options
 */
export type ThemeMode = 'light' | 'dark' | 'system'

/**
 * Breakpoint names for responsive design
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
