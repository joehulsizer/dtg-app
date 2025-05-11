"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Home() {
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u) setUser({ name: u.displayName ?? "Anonymous" });
      else   setUser(null);
    });
  }, []);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <a href="/login" className="underline text-blue-600">
          Log in
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl">Hello, {user.name}</h1>
      <button
        onClick={() => signOut(auth)}
        className="rounded bg-gray-800 px-4 py-2 text-white"
      >
        Sign out
      </button>
    </div>
  );
}
