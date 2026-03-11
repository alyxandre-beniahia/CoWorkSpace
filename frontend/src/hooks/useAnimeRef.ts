import { useEffect, useRef, type RefObject } from 'react'
import { animate } from 'animejs'
import type { AnimationParams } from 'animejs'

/**
 * Hook pour animer un élément DOM avec anime.js (v4).
 * L'animation est lancée au montage et revert au démontage.
 *
 * @param params - Paramètres passés à animate() (duration, ease, x, y, opacity, etc.)
 * @returns ref à attacher à l'élément à animer
 *
 * @example
 * const ref = useAnimeRef({ opacity: [0, 1], y: [20, 0], duration: 400 })
 * return <div ref={ref}>Contenu</div>
 */
export function useAnimeRef<T extends HTMLElement>(
  params: Omit<AnimationParams, 'targets'>
): RefObject<T | null> {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const animation = animate(el, {
      ...params,
    })

    return () => {
      animation.revert()
    }
  }, [params])

  return ref
}
