import { useEffect, useState } from 'react'
import { msUntilTomorrow, todayIso } from '../../domain/finishDate'

function laterDay(current: string) {
  const now = todayIso()

  return now > current ? now : current
}

export function useToday() {
  const [today, setToday] = useState(todayIso)

  useEffect(() => {
    let midnight: ReturnType<typeof setTimeout> | undefined

    function readToday() {
      setToday(laterDay)
      clearTimeout(midnight)
      midnight = setTimeout(readToday, msUntilTomorrow(new Date()))
    }

    function readTodayWhenVisible() {
      if (document.visibilityState === 'visible') {
        readToday()
      }
    }

    readToday()
    document.addEventListener('visibilitychange', readTodayWhenVisible)

    return () => {
      clearTimeout(midnight)
      document.removeEventListener('visibilitychange', readTodayWhenVisible)
    }
  }, [])

  return today
}
