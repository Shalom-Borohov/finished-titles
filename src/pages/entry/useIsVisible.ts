import { type RefObject, useEffect, useState } from 'react'

type Sighting = { watch: number; isVisible: boolean }

export function useIsVisible(targetRef: RefObject<HTMLDivElement | null>, watch: number) {
  const [sighting, setSighting] = useState<Sighting>({ watch, isVisible: false })

  useEffect(() => {
    const target = targetRef.current

    if (!target) {
      return
    }

    const observer = new IntersectionObserver((observed) =>
      observed.forEach(({ isIntersecting }) => setSighting({ watch, isVisible: isIntersecting })),
    )

    observer.observe(target)

    return () => observer.disconnect()
  }, [targetRef, watch])

  return sighting.watch === watch && sighting.isVisible
}
