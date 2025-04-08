import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const isProd = process.env.NEXT_PUBLIC_STAGE === "prod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
