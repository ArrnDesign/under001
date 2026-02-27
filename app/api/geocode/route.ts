import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const q = (await request.nextUrl.searchParams).get("q")

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 })
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search")
    url.searchParams.set("q", `${q}, UK`)
    url.searchParams.set("format", "json")
    url.searchParams.set("limit", "1")
    url.searchParams.set("countrycodes", "gb")

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "UNDER001-RaveFinder/1.0" },
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Geocoding failed" }, { status: 502 })
    }

    const data = await res.json()

    if (!data.length) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      },
      {
        headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
      }
    )
  } catch {
    return NextResponse.json({ error: "Geocoding service error" }, { status: 500 })
  }
}
