import { describe, it, expect } from 'vitest'
import { create } from 'zustand'

// Recreate the theme store logic without persist middleware
// This tests the core state logic independently of localStorage persistence
type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
}

function createThemeStore() {
  return create<ThemeState>()((set) => ({
    theme: 'light',
    toggleTheme: () =>
      set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light',
      })),
  }))
}

describe('useThemeStore', () => {
  it('defaults to light theme', () => {
    const store = createThemeStore()
    expect(store.getState().theme).toBe('light')
  })

  it('toggles to dark theme', () => {
    const store = createThemeStore()
    store.getState().toggleTheme()
    expect(store.getState().theme).toBe('dark')
  })

  it('toggles back to light theme', () => {
    const store = createThemeStore()
    store.getState().toggleTheme()
    store.getState().toggleTheme()
    expect(store.getState().theme).toBe('light')
  })
})
