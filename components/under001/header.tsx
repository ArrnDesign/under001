"use client"

export function Header() {
  return (
    <header className="flex flex-col items-center gap-2 pt-10 pb-6">
      <p className="text-[10px] tracking-[0.3em] text-muted-foreground">
        001/110
      </p>
      <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
        UNDER001
      </h1>
      <p className="text-sm tracking-[0.2em] text-muted-foreground">
        FIND YOUR RAVE.
      </p>
    </header>
  )
}
