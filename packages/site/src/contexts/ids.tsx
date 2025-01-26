"use client";

import React, { useContext } from "react";

interface IdsContextInterface {
  shortUrlId: string;
  setShortUrlId: React.Dispatch<React.SetStateAction<string>>;
  longUrl: string;
  setLongUrl: React.Dispatch<React.SetStateAction<string>>;
}

const IdsContext = React.createContext<IdsContextInterface | undefined>(undefined);

export const useIds = () => {
  const context = useContext(IdsContext);
  if (context) return context;
  throw new Error("Tried to use the IdsContext when it hasn't been provided yet.");
};

export const IdsProvider = ({ children }: { children: React.ReactNode }) => {
  const [shortUrlId, setShortUrlId] = React.useState("");
  const [longUrl, setLongUrl] = React.useState("");

  const value = React.useMemo(
    () => ({ shortUrlId, setShortUrlId, longUrl, setLongUrl }),
    [shortUrlId, setShortUrlId, longUrl, setLongUrl],
  );

  return <IdsContext.Provider value={value}>{children}</IdsContext.Provider>;
};
