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
  throw new Error("Using the IdsContext when it hasn't been provided yet.");
};

export const IdsProvider = ({ children }: { children: React.ReactNode }) => {
  const [shortUrlId, setShortUrlId] = React.useState("");
  const [longUrl, setLongUrl] = React.useState("");

  return (
    <IdsContext.Provider value={{ shortUrlId, setShortUrlId, longUrl, setLongUrl }}>{children}</IdsContext.Provider>
  );
};
