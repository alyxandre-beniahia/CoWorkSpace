import '@testing-library/jest-dom/vitest'

// Polyfill matchMedia pour jsdom (utilisé par useMediaQuery)
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }
  }) as unknown as typeof window.matchMedia
}
