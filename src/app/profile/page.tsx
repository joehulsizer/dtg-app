"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  setRecommendFlag,
  listenRecommended,
  toggleFollow,
  listenFollowing,
} from "@/lib/userFlags";
import { ARTISTS } from "@/lib/artists";

const MOCK_OTHER_UID = "mockFriendUid123";

export default function ProfilePage() {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [recIds, setRecIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);   // <-- NEW**
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenFollowing(user.uid, setFollowing);
    return unsub;
  }, [user]);
  
  /* watch auth */
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u ? { uid: u.uid } : null);
      setReady(true);                // <-- NEW
    });
  }, []);

  /* watch recommended list once we know the user */
  useEffect(() => {
    if (!user) return;
    const unsub = listenRecommended(user.uid, setRecIds);
    return unsub;
  }, [user]);

  /* 🔄 1) still initialising */
  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span>Loading…</span>
      </div>
    );
  }

  /* 🔒 2) initialised, but not signed in */
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
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold">Recommended artists</h1>
{/* TEMP follow other user button */}
{user && user.uid !== MOCK_OTHER_UID && (
  <button
    onClick={() =>
      toggleFollow({ uid: user.uid, targetUid: MOCK_OTHER_UID })
    }
    className={`rounded px-3 py-1 ${
      following.includes(MOCK_OTHER_UID)
        ? "bg-red-600 text-white"
        : "bg-green-600 text-white"
    }`}
  >
    {following.includes(MOCK_OTHER_UID) ? "Unfollow" : "Follow"} demo friend
  </button>
)}

      {ARTISTS.map((a) => {
        const checked = recIds.includes(a.id);
        return (
          <label
            key={a.id}
            className="flex items-center gap-2 py-1 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() =>
                setRecommendFlag({
                  uid: user.uid,
                  artistId: a.id,
                  on: !checked,
                })
              }
            />
            {a.name}
          </label>
        );
      })}
    </div>
  );
}
