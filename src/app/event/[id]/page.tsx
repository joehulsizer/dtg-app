"use client";

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { setDtgFlag, listenDtg } from "@/lib/userFlags";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { listenAllUsers, UserDoc } from "@/lib/userFlags";

/** Runtime type for one event (client side only) */
type EventView = {
  id: string;
  title: string;
  venue: string;
  date: string;     // formatted for display
  artistId: string;
};

export default function EventPage() {
  const { id } = useParams<{ id: string }>();        // ← URL param
  const [event, setEvent] = useState<EventView | null>(null);
  const [uid, setUid]     = useState<string | null>(null);
  const [isDtg, setIsDtg] = useState(false);
  const [allUsers, setAllUsers] = useState<UserDoc[]>([]);


  const [copied, setCopied] = useState(false);
const handleCopy = async () => {
  await navigator.clipboard.writeText(window.location.href);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};

  /* authenticate silently so we can toggle DTG */
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUid(u ? u.uid : null));
  }, []);

  useEffect(() => {
    const unsub = listenAllUsers(setAllUsers);
    return unsub;
  }, []);
  
  /* fetch the event once */
  useEffect(() => {
    async function run() {
      const snap = await getDoc(doc(db, "events", id));
      if (!snap.exists()) return;   // could add 404 later
      const d = snap.data();
      setEvent({
        id: snap.id,
        title: d.title,
        venue: d.venue,
        date: new Date(d.date.seconds * 1000).toLocaleDateString(),
        artistId: d.artistId,
      });
    }
    run();
  }, [id]);

  /* listen to user’s DTG list so button stays synced */
  useEffect(() => {
    if (!uid) return;
    const unsub = listenDtg(uid, (arr) => setIsDtg(arr.includes(id)));
    return unsub;
  }, [uid, id]);

  if (!event) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span>Loading…</span>
      </div>
    );
  }
  const dtgCount = allUsers.filter((u) => u.dtg?.includes(event.id)).length;
  const recCount = allUsers.filter((u) =>
    u.recommended?.includes(event.artistId)
  ).length;
  
  return (
    <div className="mx-auto max-w-lg p-8 space-y-6">
      <h1 className="text-2xl font-semibold">{event.title}</h1>
      <p className="text-sm text-gray-600">
  {recCount} friends recommend&nbsp;&middot;&nbsp;{dtgCount} friends DTG
</p>

      <p className="text-gray-700">
        {event.venue} — {event.date}
      </p>

      {uid && (
        <button
          onClick={() =>
            setDtgFlag({ uid, eventId: id, on: !isDtg })
          }
          className={`rounded px-4 py-2 ${
            isDtg ? "bg-green-600 text-white" : "bg-gray-200"
          }`}
        >
          ⚡ {isDtg ? "DTG (on)" : "DTG (off)"}
        </button>
      )}
            <button
                onClick={handleCopy}
                className="rounded bg-blue-600 px-4 py-2 text-white"
            >
                Copy link 📋
            </button>

            {copied && (
                <span className="text-sm text-green-600">Link copied!</span>
            )}

    </div>
  );
}
