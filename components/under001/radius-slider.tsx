"use client"

interface RadiusSliderProps {
  value: number
  onChange: (val: number) => void
}

export function RadiusSlider({ value, onChange }: RadiusSliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <p className="text-xs tracking-wider text-foreground">
          RADIUS: <span className="font-bold">{value} MI</span>
        </p>
        <p className="text-xs tracking-wider text-muted-foreground">250 MI</p>
      </div>
      <input
        type="range"
        min={1}
        max={250}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-[2px] bg-border appearance-none cursor-pointer accent-foreground"
        aria-label="Search radius in miles"
      />
      <p className="text-[10px] tracking-wider text-muted-foreground">1 MI</p>
    </div>
  )
}
