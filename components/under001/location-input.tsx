"use client"

import { MapPin, Loader2 } from "lucide-react"
import { useState, useCallback, useRef } from "react"

interface LocationInputProps {
  value: string
  onLocationSet: (lat: number, lng: number, name: string) => void
}

export function LocationInput({ value, onLocationSet }: LocationInputProps) {
  const [input, setInput] = useState(value)
  const [geoLoading, setGeoLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const geocodeQuery = useCallback(
    async (query: string) => {
      if (!query.trim()) return
      setSearching(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(query.trim())}`
        )
        if (!res.ok) {
          setError("Location not found")
          return
        }
        const data = await res.json()
        onLocationSet(data.lat, data.lng, query.trim().toUpperCase())
      } catch {
        setError("Search failed")
      } finally {
        setSearching(false)
      }
    },
    [onLocationSet]
  )

  const handleInputChange = (val: string) => {
    setInput(val)
    setError(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (val.trim().length >= 2) {
        geocodeQuery(val)
      }
    }, 800)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      geocodeQuery(input)
    }
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported")
      return
    }
    setGeoLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setInput("CURRENT LOCATION")
        onLocationSet(pos.coords.latitude, pos.coords.longitude, "CURRENT LOCATION")
        setGeoLoading(false)
      },
      () => {
        setError("Location access denied")
        setGeoLoading(false)
      },
      { timeout: 10000 }
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-stretch border border-border">
        <div className="flex items-center gap-2 flex-1 px-3 py-3">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ENTER LOCATION..."
            className="w-full bg-transparent text-sm tracking-wider text-foreground placeholder:text-muted-foreground focus:outline-none uppercase"
            aria-label="Search location"
          />
          {searching && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />
          )}
        </div>
        <button
          onClick={useCurrentLocation}
          disabled={geoLoading}
          className="px-4 py-3 border-l border-border text-xs tracking-wider text-foreground hover:bg-accent transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
          aria-label="Use current location"
        >
          {geoLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "USE CURRENT"
          )}
        </button>
      </div>
      {error && (
        <p className="text-xs tracking-wider text-destructive">{error}</p>
      )}
    </div>
  )
}
