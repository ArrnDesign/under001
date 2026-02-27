"use client"

import { ExternalLink, Navigation } from "lucide-react"
import type { RaveEvent } from "@/lib/types"

interface EventCardProps {
  event: RaveEvent
  index: number
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d
    .toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    .toUpperCase()
}

export function EventCard({ event, index }: EventCardProps) {
  const startTime = formatTime(event.startDateTime)
  const endTime = event.endDateTime ? formatTime(event.endDateTime) : null
  const dateLabel = formatDate(event.startDateTime)
  const eventNum = String(index + 1).padStart(3, "0")

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${event.venue.lat},${event.venue.lng}`

  return (
    <article className="border border-border p-4 flex flex-col gap-3 hover:border-foreground/40 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground">
            EVENT {eventNum}
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {startTime}
            {endTime ? ` \u2014 ${endTime}` : ""}
          </p>
          <p className="text-xs tracking-wider text-muted-foreground">
            {dateLabel}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-bold tracking-wider text-foreground">
          {event.venue.city || "TBA"}
        </p>
        <p className="text-xs tracking-wider text-muted-foreground">
          {event.venue.name}
        </p>
      </div>

      <p className="text-xs tracking-wider text-foreground/80 line-clamp-1">
        {event.title}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <a
            href={event.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] tracking-wider border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            TICKETS
          </a>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] tracking-wider border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          >
            <Navigation className="h-3 w-3" />
            DIRECTIONS
          </a>
        </div>
        {event.priceText && (
          <p className="text-xs tracking-wider text-foreground">
            {event.priceText}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="px-2 py-1 text-[9px] tracking-wider border border-border text-muted-foreground">
          {event.provider.toUpperCase()}
        </span>
        {event.genres.map((g) => (
          <span
            key={g}
            className="px-2 py-1 text-[9px] tracking-wider border border-border text-muted-foreground"
          >
            {g.toUpperCase()}
          </span>
        ))}
      </div>
    </article>
  )
}
