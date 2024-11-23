import React from "react";
import { Card } from "./ui/card";
import { useTheme } from "next-themes";

const GradientCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { resolvedTheme } = useTheme();
    return (
      <Card ref={ref} className="overflow-hidden" {...props}>
        {props.children}
        <div className="blur-3xl">
          <div
            // Had some glitching in iOS Safari when animating the opacity, adding will-change: opacity helped
            // https://css-tricks.com/almanac/properties/w/will-change/
            className={`${resolvedTheme === "dark" ? "bg-violet-950/90" : "bg-indigo-600/40"} h-20 w-4/12 absolute will-change-[opacity] animate-fade-in-slow rounded-3xl -mt-4 left-0`}
          />
          <div
            className={`${resolvedTheme === "dark" ? "bg-purple-950/90" : "bg-blue-600/20"} h-20 w-4/12 absolute will-change-[opacity] animate-fade-in-slow rounded-3xl left-1/3 -mt-8`}
          />
          <div
            className={`${resolvedTheme === "dark" ? "bg-fuchsia-950/90" : "bg-fuchsia-600/20"} h-20 w-4/12 absolute will-change-[opacity] animate-fade-in-slow rounded-3xl left-2/3 -mt-16`}
          />
        </div>
      </Card>
    );
  },
);
GradientCard.displayName = "GradientCard";

export { GradientCard };
