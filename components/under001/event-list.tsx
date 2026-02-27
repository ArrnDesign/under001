"use client"

import type { RaveEvent } from "@/lib/types"
import { EventCard } from "./event-card"

interface EventListProps {
  events: RaveEvent[]
  total: number
  loading: boolean
  error: string | null
  isMock: boolean
  page: number
  onPageChange: (p: number) => void
}

const PER_PAGE = 4

function SkeletonCard() {
  return (
    <div className="border border-border p-4 flex flex-col gap-3 animate-pulse">
      <div className="h-3 w-20 bg-muted" />
      <div className="h-8 w-40 bg-muted" />
      <div className="h-3 w-28 bg-muted" />
      <div className="h-4 w-32 bg-muted" />
      <div className="h-3 w-48 bg-muted" />
      <div className="flex gap-2">
        <div className="h-8 w-20 bg-muted" />
        <div className="h-8 w-24 bg-muted" />
      </div>
    </div>
  )
}

export function EventList({
  events,
  total,
  loading,
  error,
  isMock,
  page,
  onPageChange,
}: EventListProps) {
  const totalPages = Math.ceil(events.length / PER_PAGE)
  const start = (page - 1) * PER_PAGE
  const visible = events.slice(start, start + PER_PAGE)

  return (
    <section className="flex flex-col gap-4">
      {/* Results header */}
      <div className="flex flex-col items-center gap-1 py-3 border-t border-b border-border/50">
        <div className="flex items-center gap-3">
          <span className="w-12 h-[1px] bg-border/50" />
          <h2 className="text-sm font-bold tracking-[0.2em] text-foreground">
            RESULTS
          </h2>
          <span className="w-12 h-[1px] bg-border/50" />
        </div>
        <p className="text-[10px] tracking-wider text-muted-foreground">
          {loading ? "SEARCHING..." : `${total} EVENTS FOUND`}
        </p>
        {isMock && !loading && (
          <p className="text-[9px] tracking-wider text-muted-foreground/60">
            DEMO DATA — ADD SKIDDLE_API_KEY FOR LIVE RESULTS
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="border border-destructive/50 p-3 text-center">
          <p className="text-xs tracking-wider text-destructive">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && events.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-xs tracking-wider text-muted-foreground">
            NO EVENTS FOUND
          </p>
          <p className="text-[10px] tracking-wider text-muted-foreground/60 mt-1">
            TRY A DIFFERENT LOCATION OR WIDER RADIUS
          </p>
        </div>
      )}

      {/* Event cards */}
      {!loading && visible.length > 0 && (
        <div className="flex flex-col gap-3">
          {visible.map((event, i) => (
            <EventCard key={event.id} event={event} index={start + i} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-3">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="text-xs tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            aria-label="Previous page"
          >
            {"<"}
          </button>
          <p className="text-xs tracking-wider text-foreground">
            {start + 1} &mdash;{" "}
            <span className="font-bold">
              {Math.min(start + PER_PAGE, events.length)}
            </span>{" "}
            / {events.length}
          </p>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="text-xs tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            aria-label="Next page"
          >
            {">"}
          </button>
        </div>
      )}
    </section>
  )
}
