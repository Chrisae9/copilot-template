# Components Directory

This directory contains reusable React components organized by feature or type.

## Structure

```
src/components/
├── ui/           # Basic UI components (Button, Input, Card, etc.)
├── layout/       # Layout components (Header, Footer, Sidebar, etc.)
├── forms/        # Form-related components
├── navigation/   # Navigation components
└── index.ts      # Barrel exports for easy importing
```

## Best Practices

- Keep components small and focused on a single responsibility
- Use TypeScript interfaces for all props
- Document components with JSDoc
- Export components and types from barrel files
- Include comprehensive tests for each component

## Example Component Structure

```typescript
// components/ui/Button/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'small' | 'medium' | 'large'
  onClick?: () => void
  children: React.ReactNode
}

export function Button({ variant = 'primary', size = 'medium', onClick, children }: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// components/ui/Button/index.ts
export { Button } from './Button'
export type { ButtonProps } from './Button'

// components/ui/index.ts
export * from './Button'

// components/index.ts  
export * from './ui'
```

Start building your component library here!
