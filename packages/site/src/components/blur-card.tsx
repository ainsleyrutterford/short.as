import React from "react";
import { Card } from "./ui/card";
import { useTheme } from "next-themes";

const BlurCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { resolvedTheme } = useTheme();
    return (
      <Card ref={ref} className="bg-white/45 border-none shadow-none" {...props}>
        {props.children}
      </Card>
    );
  },
);
BlurCard.displayName = "BlurCard";

export { BlurCard };
