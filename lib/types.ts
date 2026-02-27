export interface EventVenue {
  name: string
  address?: string
  city?: string
  lat: number
  lng: number
}

export interface RaveEvent {
  id: string
  provider: "skiddle"
  title: string
  startDateTime: string
  endDateTime?: string
  venue: EventVenue
  priceText?: string
  link: string
  genres: string[]
}

export interface SearchFilters {
  lat: number | null
  lng: number | null
  locationName: string
  radius: number
  dateRange: "tonight" | "weekend" | "7days" | "14days" | "custom"
  customStart?: string
  customEnd?: string
  genres: string[]
  keyword: string
}

export type ViewMode = "list" | "cards"
