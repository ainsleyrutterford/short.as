"use client";

import React, { useContext } from "react";

import type { User } from "@short-as/types";

interface AuthContextInterface {
  loggedIn: boolean;
  setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  user: User | undefined;
}

const AuthContext = React.createContext<AuthContextInterface | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context) return context;
  throw new Error("Tried to use the AuthContext when it hasn't been provided yet.");
};

const getUser = async (): Promise<User> => {
  const data = await window.fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/oauth/me`, {
    method: "GET",
    // Necessary to send cookies
    credentials: "include",
  });

  // TODO: if 403, redirect to login screen?
  // TODO: if not 200 or 403, show nice error toast
  if (data.status !== 200) throw new Error(`Received status code: ${data.status}`);

  return data.json();
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [user, setUser] = React.useState<User | undefined>(undefined);

  React.useEffect(() => {
    setLoggedIn(window.localStorage.getItem("loggedIn") === "true");
  }, []);

  React.useEffect(() => {
    const updateUser = async () => {
      if (loggedIn) {
        const user = await getUser();
        setUser(user);
        window.localStorage.setItem("lastUsedOAuthProvider", user.oAuthProvider);
      } else {
        setUser(undefined);
      }
    };

    updateUser();
  }, [loggedIn]);

  const value = React.useMemo(() => ({ setLoggedIn, loggedIn, user }), [loggedIn, setLoggedIn, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
