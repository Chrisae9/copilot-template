import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test/utils'
import App from '../App'

describe('App', () => {
  it('renders the main heading', () => {
    renderWithProviders(<App />)
    
    expect(screen.getByText('TypeScript React Vite Template')).toBeInTheDocument()
  })

  it('renders the welcome message', () => {
    renderWithProviders(<App />)
    
    expect(screen.getByText('Welcome Home')).toBeInTheDocument()
  })

  it('renders the feature list', () => {
    renderWithProviders(<App />)
    
    expect(screen.getByText('React 19 with TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Vite for fast development and building')).toBeInTheDocument()
    expect(screen.getByText('Tailwind CSS v4 for styling')).toBeInTheDocument()
  })
})
