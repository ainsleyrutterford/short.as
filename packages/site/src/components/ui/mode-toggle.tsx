"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { MoonIcon, SunIcon } from "@primer/octicons-react"

const ThemeIcon = () => (
  <>
    <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
    <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    <span className="sr-only">Toggle theme</span>
  </>
)

export function ModeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <ThemeIcon />
      </Button>
    )
  }

  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger className="h-9 w-9 border-0 bg-transparent shadow-none focus:ring-0 hover:bg-accent hover:text-accent-foreground justify-center p-0 [&>svg:last-child]:hidden">
        <ThemeIcon />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="system">System</SelectItem>
      </SelectContent>
    </Select>
  )
}
