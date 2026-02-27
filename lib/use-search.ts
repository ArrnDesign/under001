"use client"

import { useCallback, useRef, useState } from "react"
import type { RaveEvent, SearchFilters } from "./types"

function getDateRange(range: SearchFilters["dateRange"], customStart?: string, customEnd?: string) {
  const now = new Date()
  const today = now.toISOString().split("T")[0]

  switch (range) {
    case "tonight":
      return { minDate: today, maxDate: today }
    case "weekend": {
      const day = now.getDay()
      const fri = new Date(now)
      fri.setDate(now.getDate() + ((5 - day + 7) % 7 || 7))
      if (day >= 5 || day === 0) fri.setDate(now.getDate())
      const sun = new Date(fri)
      sun.setDate(fri.getDate() + (day === 0 ? 0 : 7 - fri.getDay()))
      return {
        minDate: fri.toISOString().split("T")[0],
        maxDate: sun.toISOString().split("T")[0],
      }
    }
    case "7days": {
      const end = new Date(now)
      end.setDate(end.getDate() + 7)
      return { minDate: today, maxDate: end.toISOString().split("T")[0] }
    }
    case "14days": {
      const end = new Date(now)
      end.setDate(end.getDate() + 14)
      return { minDate: today, maxDate: end.toISOString().split("T")[0] }
    }
    case "custom":
      return { minDate: customStart || today, maxDate: customEnd || today }
    default:
      return { minDate: today, maxDate: today }
  }
}

export function useSearch() {
  const [events, setEvents] = useState<RaveEvent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMock, setIsMock] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const search = useCallback(async (filters: SearchFilters) => {
    if (!filters.lat || !filters.lng) {
      setError("Set a location to search")
      return
    }

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const { minDate, maxDate } = getDateRange(
        filters.dateRange,
        filters.customStart,
        filters.customEnd
      )

      const params = new URLSearchParams({
        lat: String(filters.lat),
        lng: String(filters.lng),
        radius: String(filters.radius),
        minDate,
        maxDate,
      })

      if (filters.genres.length) {
        params.set("genres", filters.genres.join(","))
      }
      if (filters.keyword) {
        params.set("keyword", filters.keyword)
      }

      const res = await fetch(`/api/events?${params}`, {
        signal: controller.signal,
      })

      if (!res.ok) throw new Error("Failed to fetch events")

      const data = await res.json()
      setEvents(data.events || [])
      setTotal(data.total || 0)
      setIsMock(data.mock || false)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError("Failed to load events. Try again.")
      setEvents([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  return { events, total, loading, error, isMock, search }
}
