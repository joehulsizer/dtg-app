"use client";

import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function LoginPage() {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      window.location.href = "/";      // simple redirect for now
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <button
        onClick={handleLogin}
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        Sign in with Google
      </button>
    </div>
  );
}
