# Hooks Directory

Custom React hooks for reusable state logic and side effects.

## Organization

- **hooks/**: Custom React hooks organized by feature or purpose
- **index.ts**: Barrel exports for easy importing

## Example Hook Structure

```typescript
// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react'

/**
 * Custom hook for managing localStorage state
 * @param key - The localStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns Array with current value and setter function
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'light')
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value: T) => {
    try {
      setStoredValue(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}

// hooks/index.ts
export { useLocalStorage } from './useLocalStorage'
```

## Best Practices

- Document hooks with JSDoc including @param, @returns, and @example
- Use TypeScript generics for flexibility
- Handle edge cases and errors gracefully
- Write comprehensive tests for all hooks
- Keep hooks focused on a single responsibility
