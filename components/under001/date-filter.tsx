"use client"

import { useState } from "react"
import { X } from "lucide-react"
import type { SearchFilters } from "@/lib/types"

type DateRange = SearchFilters["dateRange"]

interface DateFilterProps {
  value: DateRange
  customStart?: string
  customEnd?: string
  onChange: (range: DateRange, start?: string, end?: string) => void
}

const options: { label: string; value: DateRange }[] = [
  { label: "TONIGHT", value: "tonight" },
  { label: "THIS WEEKEND", value: "weekend" },
  { label: "NEXT 7 DAYS", value: "7days" },
  { label: "NEXT 14 DAYS", value: "14days" },
  { label: "CUSTOM", value: "custom" },
]

export function DateFilter({
  value,
  customStart,
  customEnd,
  onChange,
}: DateFilterProps) {
  const [showCustom, setShowCustom] = useState(value === "custom")
  const [start, setStart] = useState(customStart || "")
  const [end, setEnd] = useState(customEnd || "")

  const handleSelect = (range: DateRange) => {
    if (range === "custom") {
      setShowCustom(true)
      onChange("custom", start, end)
    } else {
      setShowCustom(false)
      onChange(range)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={`px-3 py-2 text-[11px] tracking-wider border transition-colors ${
              value === opt.value
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
            aria-pressed={value === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="flex flex-col gap-2 p-3 border border-border relative">
          <button
            onClick={() => {
              setShowCustom(false)
              onChange("7days")
            }}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            aria-label="Close custom date picker"
          >
            <X className="h-3 w-3" />
          </button>
          <p className="text-[10px] tracking-wider text-muted-foreground">
            CUSTOM DATE RANGE
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] tracking-wider text-muted-foreground block mb-1">
                FROM
              </label>
              <input
                type="date"
                value={start}
                onChange={(e) => {
                  setStart(e.target.value)
                  onChange("custom", e.target.value, end)
                }}
                className="w-full bg-input text-foreground text-xs px-2 py-2 border border-border focus:outline-none focus:border-foreground"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] tracking-wider text-muted-foreground block mb-1">
                TO
              </label>
              <input
                type="date"
                value={end}
                onChange={(e) => {
                  setEnd(e.target.value)
                  onChange("custom", start, e.target.value)
                }}
                className="w-full bg-input text-foreground text-xs px-2 py-2 border border-border focus:outline-none focus:border-foreground"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
