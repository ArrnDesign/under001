"use client"

const GENRES = [
  "TECHNO",
  "DRUM & BASS",
  "JUNGLE",
  "GARAGE",
  "TRANCE",
  "HARD DANCE",
  "DUBSTEP",
  "HOUSE",
]

interface GenreFilterProps {
  selected: string[]
  keyword: string
  onGenresChange: (genres: string[]) => void
  onKeywordChange: (kw: string) => void
}

export function GenreFilter({
  selected,
  keyword,
  onGenresChange,
  onKeywordChange,
}: GenreFilterProps) {
  const toggle = (genre: string) => {
    const lower = genre.toLowerCase()
    if (selected.includes(lower)) {
      onGenresChange(selected.filter((g) => g !== lower))
    } else {
      onGenresChange([...selected, lower])
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {GENRES.map((genre) => {
          const isActive = selected.includes(genre.toLowerCase())
          return (
            <button
              key={genre}
              onClick={() => toggle(genre)}
              className={`px-3 py-2 text-[11px] tracking-wider border transition-colors ${
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
              aria-pressed={isActive}
            >
              {genre}
            </button>
          )
        })}
      </div>
      <input
        type="text"
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        placeholder="OPTIONAL KEYWORD..."
        className="w-full bg-transparent text-xs tracking-wider px-3 py-2 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
      />
    </div>
  )
}
