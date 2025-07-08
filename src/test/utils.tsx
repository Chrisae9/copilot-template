import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ReactElement } from 'react'

/**
 * Custom render function that includes necessary providers
 */
export function renderWithProviders(ui: ReactElement) {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  )
}

export * from '@testing-library/react'
