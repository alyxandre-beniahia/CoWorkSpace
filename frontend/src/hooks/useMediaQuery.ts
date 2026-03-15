import { useEffect, useState } from 'react'

/**
 * Returns true when the viewport width is below the given breakpoint (default 768px, Tailwind md).
 */
export function useMediaQuery(maxWidthPx: number = 768): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < maxWidthPx : false
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(`(max-width: ${maxWidthPx - 1}px)`)
    const handler = () => setMatches(mql.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [maxWidthPx])

  return matches
}
