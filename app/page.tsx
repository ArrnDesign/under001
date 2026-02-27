"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Header } from "@/components/under001/header"
import { LocationInput } from "@/components/under001/location-input"
import { RadiusSlider } from "@/components/under001/radius-slider"
import { DateFilter } from "@/components/under001/date-filter"
import { GenreFilter } from "@/components/under001/genre-filter"
import { EventList } from "@/components/under001/event-list"
import { useSearch } from "@/lib/use-search"
import type { SearchFilters } from "@/lib/types"

const DEFAULT_FILTERS: SearchFilters = {
  lat: null,
  lng: null,
  locationName: "",
  radius: 25,
  dateRange: "7days",
  genres: [],
  keyword: "",
}

const CITY_PRESETS: Record<string, { lat: number; lng: number }> = {
  LONDON: { lat: 51.5074, lng: -0.1278 },
  MANCHESTER: { lat: 53.4808, lng: -2.2426 },
  GLASGOW: { lat: 55.8642, lng: -4.2518 },
  BRISTOL: { lat: 51.4545, lng: -2.5879 },
  LEEDS: { lat: 53.8008, lng: -1.5491 },
  EDINBURGH: { lat: 55.9533, lng: -3.1883 },
  BIRMINGHAM: { lat: 52.4862, lng: -1.8904 },
  LIVERPOOL: { lat: 53.4084, lng: -2.9916 },
}

function genresToCode(genres: string[]) {
  const set = new Set(genres.map((g) => g.toLowerCase()))
  const codes: string[] = []
  if (set.has("drum & bass")) codes.push("DNB")
  if (set.has("jungle")) codes.push("JNG")
  if (set.has("techno")) codes.push("TNO")
  if (set.has("garage")) codes.push("UKG")
  if (set.has("trance")) codes.push("TRN")
  if (set.has("hard dance")) codes.push("HRD")
  if (set.has("dubstep")) codes.push("DUB")
  if (set.has("house")) codes.push("HSE")
  return codes.length ? codes.join("+") : "ALL"
}

function codeToGenres(code: string) {
  const map: Record<string, string> = {
    DNB: "Drum & Bass",
    JNG: "Jungle",
    TNO: "Techno",
    UKG: "Garage",
    TRN: "Trance",
    HRD: "Hard Dance",
    DUB: "Dubstep",
    HSE: "House",
  }
  if (!code || code === "ALL") return []
  return code
    .split("+")
    .map((c) => map[c])
    .filter(Boolean)
}

function dateRangeToCode(range?: string) {
  switch (range) {
    case "tonight":
      return "TNT"
    case "weekend":
      return "WKD"
    case "7days":
      return "7D"
    case "14days":
      return "14D"
    case "custom":
      return "CST"
    default:
      return "7D"
  }
}

function codeToDateRange(code?: string) {
  switch (code) {
    case "TNT":
      return "tonight"
    case "WKD":
      return "weekend"
    case "14D":
      return "14days"
    case "CST":
      return "custom"
    case "7D":
    default:
      return "7days"
  }
}

// NOTE: for V1 we encode a CITY token (for presets) — we'll upgrade later to also encode @lat,lng for any location.
function buildHash(filters: SearchFilters) {
  const city = (filters.locationName || "UK").replace(/\s+/g, "_").toUpperCase()
  const genreCode = genresToCode(filters.genres || [])
  const r = `${Math.round(filters.radius || 25)}MI`
  const d = dateRangeToCode(filters.dateRange)
  return `#RADAR/${city}/${genreCode}/${r}/${d}`
}

function parseHash(hash: string) {
  // #RADAR/CITY/GENRES/RADIUS/DATE
  const parts = (hash || "").replace(/^#/, "").split("/")
  if (parts.length < 5) return null
  if (parts[0] !== "RADAR") return null

  const city = parts[1]?.replace(/_/g, " ").toUpperCase()
  const genreCode = parts[2]?.toUpperCase()
  const rRaw = parts[3]?.toUpperCase().replace("MI", "")
  const dCode = parts[4]?.toUpperCase()

  const radius = Math.max(1, Math.min(250, Number(rRaw) || 25))
  const genres = codeToGenres(genreCode || "ALL")
  const dateRange = codeToDateRange(dCode)

  const preset = city && CITY_PRESETS[city]
  return { city, preset, radius, genres, dateRange }
}

export default function Home() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const { events, total, loading, error, isMock, search } = useSearch()
  const hasSearched = useRef(false)
  const applyingHashRef = useRef(false)

  const doSearch = useCallback(() => {
    if (filters.lat && filters.lng) {
      setPage(1)
      search(filters)
      hasSearched.current = true
      // Update hash when a search actually happens
      window.location.hash = buildHash(filters)
    }
  }, [filters, search])

  // Read hash on first load (serial share links)
  useEffect(() => {
    const parsed = parseHash(window.location.hash)
    if (parsed?.preset) {
      applyingHashRef.current = true
      setFilters((f) => ({
        ...f,
        lat: parsed.preset!.lat,
        lng: parsed.preset!.lng,
        locationName: parsed.city || "",
        radius: parsed.radius,
        genres: parsed.genres,
        dateRange: parsed.dateRange as any,
      }))
      // Give state a tick then auto-search
      setTimeout(() => {
        applyingHashRef.current = false
        hasSearched.current = true
        search({
          ...DEFAULT_FILTERS,
          lat: parsed.preset!.lat,
          lng: parsed.preset!.lng,
          locationName: parsed.city || "",
          radius: parsed.radius,
          genres: parsed.genres,
          dateRange: parsed.dateRange as any,
          keyword: "",
        })
      }, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Listen for hash changes (opening shared links while app is open)
  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseHash(window.location.hash)
      if (!parsed?.preset) return
      applyingHashRef.current = true
      setFilters((f) => ({
        ...f,
        lat: parsed.preset!.lat,
        lng: parsed.preset!.lng,
        locationName: parsed.city || "",
        radius: parsed.radius,
        genres: parsed.genres,
        dateRange: parsed.dateRange as any,
      }))
      setTimeout(() => {
        applyingHashRef.current = false
        hasSearched.current = true
        search({
          ...DEFAULT_FILTERS,
          lat: parsed.preset!.lat,
          lng: parsed.preset!.lng,
          locationName: parsed.city || "",
          radius: parsed.radius,
          genres: parsed.genres,
          dateRange: parsed.dateRange as any,
          keyword: "",
        })
      }, 0)
    }

    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Search on filter changes (after first search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!hasSearched.current) return
    if (applyingHashRef.current) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch()
    }, 450)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.radius,
    filters.dateRange,
    filters.genres,
    filters.keyword,
    filters.customStart,
    filters.customEnd,
  ])

  const now = new Date()
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })

  return (
    <main className="relative min-h-screen bg-background overflow-hidden">
      {/* Noise overlay */}
      <div
        className="fixed inset-0 opacity-[0.04] pointer-events-none z-10"
        style={{
          backgroundImage: "url(/images/noise.jpg)",
          backgroundRepeat: "repeat",
          backgroundSize: "200px",
        }}
      />

      {/* Faint grid lines */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Corner serial labels (desktop only) */}
      <div className="fixed top-4 left-4 text-[9px] tracking-[0.2em] text-muted-foreground/30 z-20 hidden sm:block">
        UNDER001 / RADAR
      </div>
      <div className="fixed top-4 right-4 text-[9px] tracking-[0.2em] text-muted-foreground/30 z-20 hidden sm:block">
        ARCHIVE {timeStr}
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-md px-5 pb-12">
        <Header />

        {/* Control deck (sticky on mobile) */}
        <section className="sticky top-0 z-30 -mx-5 px-5 pt-3 pb-4 bg-background/85 backdrop-blur border-b border-foreground/10">
          <div className="flex items-center justify-between">
            <p className="text-[9px] tracking-[0.25em] text-muted-foreground/60">
              UNDER001 / RADAR
            </p>
            <p className="text-[9px] tracking-[0.25em] text-muted-foreground/40">
              ARCHIVE {timeStr}
            </p>
          </div>

          <div className="flex flex-col gap-4 mt-4">
            <LocationInput
              value={filters.locationName}
              onLocationSet={(lat, lng, name) => {
                setFilters((f) => ({ ...f, lat, lng, locationName: name }))
              }}
            />


            <RadiusSlider
              value={filters.radius}
              onChange={(r) => setFilters((f) => ({ ...f, radius: r }))}
            />

            <DateFilter
              value={filters.dateRange}
              customStart={filters.customStart}
              customEnd={filters.customEnd}
              onChange={(range, start, end) =>
                setFilters((f) => ({
                  ...f,
                  dateRange: range,
                  customStart: start,
                  customEnd: end,
                }))
              }
            />

            <GenreFilter
              selected={filters.genres}
              keyword={filters.keyword}
              onGenresChange={(g) => setFilters((f) => ({ ...f, genres: g }))}
              onKeywordChange={(k) => setFilters((f) => ({ ...f, keyword: k }))}
            />

            <button
              onClick={doSearch}
              disabled={!filters.lat || !filters.lng || loading}
              className="w-full py-3 text-xs tracking-[0.2em] font-bold border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-30"
            >
              {loading ? "SCANNING..." : "SEARCH"}
            </button>

            <button
              type="button"
              onClick={async () => {
                const url = `${window.location.origin}/${buildHash(filters)}`
                try {
                  await navigator.clipboard.writeText(url)
                } catch {
                  // fallback prompt if clipboard permission blocks
                  window.prompt("COPY LINK:", url)
                }
              }}
              disabled={!filters.lat || !filters.lng}
              className="w-full py-3 text-xs tracking-[0.2em] font-bold border border-foreground/40 text-foreground/80 hover:bg-foreground hover:text-background transition-colors disabled:opacity-30"
            >
              COPY LINK
            </button>
          </div>
        </section>

        {/* Results */}
        <section className="mt-6">
          <EventList
            events={events}
            total={total}
            loading={loading}
            error={error}
            isMock={false}
            page={page}
            onPageChange={setPage}
          />
        </section>

        <footer className="py-8 text-center">
          <p className="text-[9px] tracking-[0.2em] text-muted-foreground/40">
            UNDER001 — UK UNDERGROUND RAVE DISCOVERY
          </p>
        </footer>
      </div>
    </main>
  )
}