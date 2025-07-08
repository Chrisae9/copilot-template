# Utils Directory

Utility functions and helper modules for common operations.

## Organization

- **utils/**: Pure utility functions organized by category
- **index.ts**: Barrel exports for easy importing

## Example Utility Structure

```typescript
// utils/formatters.ts
/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'USD')
 * @returns Formatted currency string
 * @example
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1234.56, 'EUR') // "€1,234.56"
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format a date as a readable string
 * @param date - The date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 * @example
 * formatDate(new Date()) // "January 1, 2024"
 */
export function formatDate(
  date: Date, 
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
): string {
  return new Intl.DateTimeFormat('en-US', options).format(date)
}

// utils/validators.ts
/**
 * Validate an email address
 * @param email - The email to validate
 * @returns True if valid, false otherwise
 * @example
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid-email') // false
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// utils/index.ts
export * from './formatters'
export * from './validators'
```

## Best Practices

- Keep utilities pure functions (no side effects)
- Document with JSDoc including @param, @returns, and @example
- Use TypeScript for type safety
- Write comprehensive unit tests
- Group related utilities in the same file
- Export everything through barrel files
