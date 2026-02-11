import React from "react";
import { getValidUrl } from "@/lib/url";

export const useUrlInput = (initialValue = "") => {
  const [value, setValue] = React.useState(initialValue);
  const [isValid, setIsValid] = React.useState(true);

  const onChange = (newValue: string) => {
    setValue(newValue);
    setIsValid(newValue === "" || !!getValidUrl(newValue));
  };

  return { value, setValue, onChange, isValid };
};
