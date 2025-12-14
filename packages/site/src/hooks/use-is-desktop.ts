import { useMediaQuery } from "./use-media-query";

export const useIsDesktop = () => useMediaQuery("(min-width: 640px)");
