import { IonContent, IonPage } from '@ionic/react'
import { COMMON_COPY } from '../../copy/common'
import { MEDIA_TYPE_LABELS, RATING_LABELS } from '../../copy/labels'
import { useAllEntries } from '../../data/hooks'
import { buildStats, type LibraryStats } from '../../domain/stats'
import { STATS_COPY } from './copy'
import './stats.css'

const FULL_WIDTH_PERCENT = 100

const toPercent = (count: number, largest: number) => `${largest ? (count / largest) * FULL_WIDTH_PERCENT : 0}%`

function YearChart({ stats }: { stats: LibraryStats }) {
  const { byYear, olderCount, undatedCount } = stats
  const largest = Math.max(0, ...byYear.map(({ count }) => count))

  return (
    <section className="card">
      <h2>{STATS_COPY.byYear}</h2>
      {byYear.length === 0 && <p className="stats-note">{STATS_COPY.noDatedTitles}</p>}
      {byYear.length > 0 && (
        <div className="year-chart">
          {byYear.map(({ year, count }) => (
            <div key={year} className="year-column" role="img" aria-label={STATS_COPY.yearBar(year, count)}>
              <span className="year-count">{count}</span>
              <span className="year-track">
                <span className="year-bar" style={{ height: toPercent(count, largest) }} />
              </span>
              <span className="year-label">{year}</span>
            </div>
          ))}
        </div>
      )}
      {olderCount + undatedCount > 0 && <p className="stats-note">{STATS_COPY.leftOut(olderCount, undatedCount)}</p>}
    </section>
  )
}

function TypeCounts({ stats }: { stats: LibraryStats }) {
  return (
    <section className="card">
      <h2>{STATS_COPY.byType}</h2>
      <dl className="type-counts">
        {stats.byType.map(({ type, count }) => (
          <div key={type}>
            <dt>{MEDIA_TYPE_LABELS[type]}</dt>
            <dd>{count}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function RatingBars({ stats }: { stats: LibraryStats }) {
  const largest = Math.max(0, ...stats.byRating.map(({ count }) => count))

  return (
    <section className="card">
      <h2>{STATS_COPY.byRating}</h2>
      <dl className="rating-bars">
        {stats.byRating.map(({ rating, count }) => (
          <div key={rating}>
            <span className="rating-track" aria-hidden="true">
              <span className="rating-bar" style={{ width: toPercent(count, largest) }} />
            </span>
            <dt>{RATING_LABELS[rating]}</dt>
            <dd>{count}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function StatsPage() {
  const entries = useAllEntries()
  const stats = entries && buildStats(entries)

  return (
    <IonPage>
      <IonContent>
        <div className="page-body page-stack">
          <header className="stats-header">
            <h1 className="page-title">{COMMON_COPY.stats}</h1>
            {stats && <p>{STATS_COPY.summary(stats.total, stats.finished, stats.stopped)}</p>}
          </header>
          {stats && (
            <>
              <YearChart stats={stats} />
              <TypeCounts stats={stats} />
              <RatingBars stats={stats} />
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}
