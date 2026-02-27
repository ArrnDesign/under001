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
  // expect YYYY-MM-DD; if not, return null
  if (!s) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  return null
}

function normalizeEvent(e: SkiddleEvent): NormalizedEvent | null {
  const dateOnly = e.date || e.startdate
  if (!dateOnly) return null

  const lat = parseFloat(e.venue?.latitude || "")
  const lng = parseFloat(e.venue?.longitude || "")
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
    // Prefer Skiddle-provided link; otherwise leave blank-ish but valid
    link: e.link || "https://www.skiddle.com/",
    genres: e.genres?.map((g) => g.name) || [],
  }
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
  if (user) {
    // Put user keyword first, but keep our rave bundle as fallback
    built = `${user} OR ${built}`
  }

  return built
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

  // Always return something usable even without API key
  if (!apiKey) {
    const mock = getMockEvents()
    return NextResponse.json(
      { events: mock, total: mock.length, mock: true },
      {
        headers: {
          "Cache-Control": "public, max-age=30",
        },
      }
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
      const text = await res.text().catch(() => "")
      return NextResponse.json(
        { error: "Skiddle API error", status: res.status, detail: text.slice(0, 200) },
        { status: 502 }
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
      },
      {
        headers: {
          "Cache-Control": "public, max-age=30",
        },
      }
    )
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

function getMockEvents(): NormalizedEvent[] {
  const venues = [
    { name: "CORSICA STUDIOS", city: "LONDON", lat: 51.4932, lng: -0.0994 },
    { name: "THE WAREHOUSE PROJECT", city: "MANCHESTER", lat: 53.4744, lng: -2.2564 },
    { name: "MOTION", city: "BRISTOL", lat: 51.4452, lng: -2.5966 },
    { name: "SUB CLUB", city: "GLASGOW", lat: 55.8596, lng: -4.2688 },
    { name: "FABRIC", city: "LONDON", lat: 51.5198, lng: -0.1034 },
    { name: "WIRE", city: "LEEDS", lat: 53.7976, lng: -1.5410 },
    { name: "LAKOTA", city: "BRISTOL", lat: 51.4619, lng: -2.5908 },
    { name: "HIDDEN", city: "MANCHESTER", lat: 53.4862, lng: -2.2422 },
    { name: "BONGO CLUB", city: "EDINBURGH", lat: 55.9501, lng: -3.1851 },
    { name: "SWWG3", city: "GLASGOW", lat: 55.8655, lng: -4.2518 },
    { name: "THE CAUSE", city: "LONDON", lat: 51.5451, lng: -0.0552 },
    { name: "THE WHITE HOTEL", city: "MANCHESTER", lat: 53.4879, lng: -2.2366 },
  ]

  const titles = [
    "SYSTEM:OVERRIDE",
    "PRESSURE / ALL NIGHT",
    "JUNGLE MASSIVE",
    "BASS COMMUNION",
    "ARCHIVE SESSION 001",
    "WAREHOUSE PROTOCOL",
    "SUBSONIC",
    "FREQUENCY",
    "ZERO GRAVITY (DNB)",
    "WARP DRIVE",
    "HARD CODED",
    "ANALOG SIGNAL",
  ]

  const genreTags = [
    ["Techno"],
    ["Techno", "Hard Techno"],
    ["Jungle", "Drum & Bass"],
    ["Drum & Bass"],
    ["Techno", "House"],
    ["Techno"],
    ["House", "Garage"],
    ["Trance"],
    ["Drum & Bass"],
    ["Hard Dance"],
    ["Techno"],
    ["Techno", "Dubstep"],
  ]

  const now = new Date()
  return venues.map((v, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() + Math.floor(i / 2))
    const dateStr = d.toISOString().slice(0, 10)

    return {
      id: `mock-${i + 1}`,
      provider: "skiddle" as const,
      title: titles[i],
      startDateTime: `${dateStr}T23:00:00`,
      endDateTime: `${dateStr}T06:00:00`,
      venue: { name: v.name, city: v.city, lat: v.lat, lng: v.lng },
      priceText: i % 3 === 0 ? undefined : `From £${(10 + i * 2.5).toFixed(2)}`,
      link: "https://www.skiddle.com/",
      genres: genreTags[i],
    }
  })
}