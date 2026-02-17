import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-input/30 px-3 py-1.5 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

/**
 * This is a `<div>` that we style as an `<input>` since the readonly input had an issue on iOS
 * that I couldn't fix. When you tapped the input to focus it, the autofill and share menu
 * would pop up at the top of the screen instead of over the input. There was a StackOverflow
 * about it but nothing would work: https://stackoverflow.com/q/70199584
 * 
 * Also, on Firefox desktop: selecting text in the input, clicking off the input, and clicking
 * back on would cause the selection to reappear for a second before disappearing which didn't
 * look nice at all. Both of these issues happened with an unstyled `<input>` tag, so I've
 * just gone with a `<div>` instead.
 */
const ReadOnlyInput = ({ text, fadeIn, className }: { text: string; fadeIn?: boolean, className?: string }) =>
  <div className={cn("flex overflow-hidden items-center h-9 w-full rounded-md border border-input bg-input/30 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className)}>
    {text && <p className={`overflow-hidden text-ellipsis whitespace-nowrap ${fadeIn ? "animate-fade-in" : ""}`}>
      {text}
    </p>}
  </div>;

export { Input, ReadOnlyInput }
