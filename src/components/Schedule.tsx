import { useMemo, useState } from 'react'
import { EVENTS, DAYS, STANDINGS, TRACK_META, type EventTrack, type FestEvent } from '../data/events'
import { useHouse } from '../context/HouseContext'
import { HOUSE_BY_ID } from '../data/houses'

/**
 * The festival programme.
 *
 * Filterable by day and by track. On a phone the day tabs scroll
 * horizontally; on desktop everything fits in one row.
 */
export default function Schedule() {
  const { house } = useHouse()
  const [day, setDay] = useState<1 | 2 | 3>(1)
  const [track, setTrack] = useState<EventTrack | 'all'>('all')

  const tracks = useMemo(() => {
    const used = new Set(EVENTS.map((e) => e.track))
    return Object.keys(TRACK_META).filter((t) => used.has(t as EventTrack)) as EventTrack[]
  }, [])

  const visible = useMemo(
    () =>
      EVENTS.filter((e) => e.day === day && (track === 'all' || e.track === track)).sort(
        (a, b) => a.start.localeCompare(b.start),
      ),
    [day, track],
  )

  return (
    <div>
      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {DAYS.map((d) => (
          <button
            key={d.day}
            onClick={() => setDay(d.day)}
            className={`shrink-0 rounded-xl border px-4 py-2.5 text-left transition-all sm:px-6 ${
              day === d.day
                ? 'border-amber-300/50 bg-amber-300/10 text-amber-200'
                : 'border-white/10 text-stone-400 hover:border-white/25 hover:text-stone-200'
            }`}
          >
            <span className="block font-cinzel text-sm font-semibold sm:text-base">{d.label}</span>
            <span className="block text-[11px] opacity-70">{d.date}</span>
          </button>
        ))}
      </div>

      {/* Track filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip active={track === 'all'} onClick={() => setTrack('all')} label="All events" />
        {tracks.map((t) => (
          <FilterChip
            key={t}
            active={track === t}
            onClick={() => setTrack(t)}
            label={`${TRACK_META[t].icon} ${TRACK_META[t].label}`}
            color={TRACK_META[t].color}
          />
        ))}
      </div>

      {/* Timeline */}
      <ol className="mt-7 space-y-3">
        {visible.map((event) => (
          <EventRow key={event.id} event={event} myHouse={house} />
        ))}
        {visible.length === 0 && (
          <li className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-stone-500">
            Nothing scheduled here. Try another track.
          </li>
        )}
      </ol>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean
  onClick: () => void
  label: string
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all sm:text-sm"
      style={{
        borderColor: active ? (color ?? '#fcd34d') : 'rgba(255,255,255,0.1)',
        backgroundColor: active ? `${color ?? '#fcd34d'}1f` : 'transparent',
        color: active ? (color ?? '#fcd34d') : '#a8a29e',
      }}
    >
      {label}
    </button>
  )
}

function EventRow({ event, myHouse }: { event: FestEvent; myHouse: string }) {
  const meta = TRACK_META[event.track]
  const isMyHouse = event.house === myHouse

  return (
    <li
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:border-white/25 hover:bg-white/[0.06] sm:p-5"
    >
      <div
        className="absolute inset-y-0 left-0 w-1 opacity-70 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: meta.color }}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        {/* Time */}
        <div className="flex shrink-0 items-baseline gap-2 sm:w-28 sm:flex-col sm:items-start sm:gap-0">
          <span className="font-cinzel text-lg font-bold text-stone-100">{event.start}</span>
          <span className="text-xs text-stone-500">to {event.end}</span>
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-cinzel text-base font-semibold text-stone-100 sm:text-lg">
              {event.title}
            </h3>
            {isMyHouse && (
              <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-200 uppercase">
                Your house
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-stone-400">{event.blurb}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
            <span style={{ color: meta.color }}>
              {meta.icon} {meta.label}
            </span>
            <span>·</span>
            <span>📍 {event.venue}</span>
            {event.points > 0 && (
              <>
                <span>·</span>
                <span className="font-semibold text-amber-300/90">{event.points} pts</span>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

/** The House Cup standings, driven by the same event data. */
export function HouseCup() {
  const { house } = useHouse()

  const standings = useMemo(
    () =>
      STANDINGS.map((s) => ({ house: HOUSE_BY_ID[s.house], pts: s.points })).sort(
        (a, b) => b.pts - a.pts,
      ),
    [],
  )

  const top = standings[0].pts

  return (
    <div className="space-y-3">
      {standings.map((s, i) => {
        const mine = s.house.id === house
        return (
          <div key={s.house.id}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 font-medium text-stone-200">
                <span className="w-5 text-stone-500">{i + 1}</span>
                <span>{s.house.crest}</span>
                <span className={mine ? 'text-amber-200' : ''}>{s.house.name}</span>
              </span>
              <span className="font-cinzel font-bold text-stone-100">{s.pts}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(s.pts / top) * 100}%`,
                  background: `linear-gradient(90deg, ${s.house.color}, ${s.house.accent})`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
