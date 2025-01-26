import React from "react";

export const PageContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-screen-md mx-auto px-4 pt-10 sm:pt-16">{children}</div>
);
