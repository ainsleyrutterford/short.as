"use client";

import { useTheme } from "next-themes";

export const TextGradient = ({ text }: { text: string }) => {
  const { resolvedTheme } = useTheme();
  const bgGradient =
    resolvedTheme === "light"
      ? "bg-[linear-gradient(to_right,theme(colors.violet.600),theme(colors.fuchsia.500),theme(colors.purple.500),theme(colors.violet.600))]"
      : "bg-[linear-gradient(to_right,theme(colors.violet.300),theme(colors.fuchsia.300),theme(colors.purple.100),theme(colors.violet.300))]";
  return (
    <span
      className={`font-extrabold bg-clip-text text-transparent ${bgGradient} bg-[length:200%_auto] animate-gradient direction-reverse`}
    >
      {text}
    </span>
  );
};
