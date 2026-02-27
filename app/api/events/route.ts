import { NextRequest, NextResponse } from "next/server"

const GENRE_KEYWORDS: Record<string, string> = {
  techno: "techno OR hard techno OR industrial",
  "drum & bass": "drum and bass OR dnb",
  jungle: "jungle",
  garage: "garage OR ukg OR bassline",
  trance: "trance OR psytrance",
  "hard dance": "hardstyle OR hardcore OR gabber",
  dubstep: "dubstep",
  house: "house OR deep house OR tech house",
}

const DEFAULT_KEYWORD =
  "rave OR techno OR drum and bass OR dnb OR jungle OR garage OR hardstyle OR trance OR house OR dubstep"

interface SkiddleEvent {
  id: string
  eventname: string
  date?: string
  startdate?: string
  openingtimes?: {
    doorsopen?: string
    doorsclose?: string
    lastentry?: string
  }
  venue?: {
    name: string
    address?: string
    town?: string
    latitude?: string
    longitude?: string
  }
  entryprice?: string
  link?: string
  genres?: { genreid: string; name: string }[]
}

interface NormalizedEvent {
  id: string
  provider: "skiddle"
  title: string
  startDateTime: string
  endDateTime?: string
  venue: {
    name: string
    address?: string
    city?: string
    lat: number
    lng: number
  }
  priceText?: string
  link: string
  genres: string[]
}

function clampRadius(raw: string) {
  const n = Number(raw)
  if (!Number.isFinite(n)) return 25
  return Math.max(1, Math.min(250, Math.round(n)))
}

function toISODateOnly(s: string | null): string | null {
  if (!s) return null
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
}

function buildKeyword(genresParam: string | null, keywordParam: string | null) {
  let built = ""

  if (genresParam) {
    const genreList = genresParam
      .split(",")
      .map((g) => g.trim().toLowerCase())
      .filter(Boolean)

    const parts = genreList.map((g) => GENRE_KEYWORDS[g]).filter(Boolean)
    if (parts.length) built = parts.join(" OR ")
  }

  if (!built) built = DEFAULT_KEYWORD

  const user = (keywordParam || "").trim()
  if (user) built = `${user} OR ${built}`

  return built
}

function normalizeEvent(e: SkiddleEvent): NormalizedEvent | null {
  const dateOnly = e.date || e.startdate
  if (!dateOnly) return null

  const lat = Number.parseFloat(e.venue?.latitude || "")
  const lng = Number.parseFloat(e.venue?.longitude || "")
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const doorsOpen = e.openingtimes?.doorsopen || "23:00"
  const doorsClose = e.openingtimes?.doorsclose

  return {
    id: e.id,
    provider: "skiddle",
    title: e.eventname,
    startDateTime: `${dateOnly}T${doorsOpen}:00`,
    endDateTime: doorsClose ? `${dateOnly}T${doorsClose}:00` : undefined,
    venue: {
      name: e.venue?.name || "TBA",
      address: e.venue?.address,
      city: e.venue?.town,
      lat,
      lng,
    },
    priceText: e.entryprice ? `From £${e.entryprice}` : undefined,
    link: e.link || "https://www.skiddle.com/",
    genres: e.genres?.map((g) => g.name) || [],
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const latRaw = params.get("lat")
  const lngRaw = params.get("lng")
  const radius = clampRadius(params.get("radius") || "25")

  const minDate = toISODateOnly(params.get("minDate"))
  const maxDate = toISODateOnly(params.get("maxDate"))

  const genres = params.get("genres")
  const keyword = params.get("keyword")

  if (!latRaw || !lngRaw) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 })
  }

  const lat = Number(latRaw)
  const lng = Number(lngRaw)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng must be numbers" }, { status: 400 })
  }

  const apiKey = process.env.SKIDDLE_API_KEY

  // ✅ PRODUCTION-SAFE: no mock data. Just return empty until key is set.
  if (!apiKey) {
    return NextResponse.json(
      {
        events: [],
        total: 0,
        mock: false,
        configured: false,
        message: "SKIDDLE_API_KEY not configured",
      },
      { headers: { "Cache-Control": "public, max-age=30" } }
    )
  }

  try {
    const builtKeyword = buildKeyword(genres, keyword)

    const url = new URL("https://www.skiddle.com/api/v1/events/search/")
    url.searchParams.set("api_key", apiKey)
    url.searchParams.set("latitude", String(lat))
    url.searchParams.set("longitude", String(lng))
    url.searchParams.set("radius", String(radius))
    url.searchParams.set("keyword", builtKeyword)
    url.searchParams.set("order", "distance")
    url.searchParams.set("description", "1")
    url.searchParams.set("limit", "50")
    if (minDate) url.searchParams.set("minDate", minDate)
    if (maxDate) url.searchParams.set("maxDate", maxDate)

    const res = await fetch(url.toString(), { cache: "no-store" })

    if (!res.ok) {
      return NextResponse.json(
        { error: "Skiddle API error" },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      )
    }

    const data = await res.json()
    const raw = Array.isArray(data.results) ? data.results : []
    const normalized = raw.map(normalizeEvent).filter(Boolean) as NormalizedEvent[]

    return NextResponse.json(
      {
        events: normalized,
        total: data.totalcount || normalized.length,
        mock: false,
        configured: true,
      },
      { headers: { "Cache-Control": "public, max-age=30" } }
    )
  } catch {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}