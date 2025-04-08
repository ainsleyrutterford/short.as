import React from "react";
import { Card } from "./ui/card";

const BlurCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <Card ref={ref} className="bg-white/45 border-none shadow-none" {...props}>
        {props.children}
      </Card>
    );
  },
);
BlurCard.displayName = "BlurCard";

export { BlurCard };
