"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { addEvent, listenEvents, EventDoc } from "@/lib/events";
import { setDtgFlag, listenDtg } from "@/lib/userFlags";

export default function Home() {
  const [user, setUser] = useState<{ uid: string; name: string } | null>(null);
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [dtgIds, setDtgIds] = useState<string[]>([]);

  /* 1️⃣  watch Google auth state */
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u) setUser({ uid: u.uid, name: u.displayName ?? "Anonymous" });
      else setUser(null);
    });
  }, []);

  /* 2️⃣  once logged in, start live-listening to events */
  useEffect(() => {
    if (!user) return;
    const unsub = listenEvents(setEvents);
    return unsub;          // cleanup on unmount
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenDtg(user.uid, setDtgIds);
    return unsub;
  }, [user]);
  
  /* 3️⃣  local form state */
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");

  /* 4️⃣  if not logged in, show login link */
  if (!user)
    return (
      <div className="flex h-screen items-center justify-center">
        <a href="/login" className="underline text-blue-600">
          Log in
        </a>
      </div>
    );

  /* 5️⃣  logged-in UI */
  return (
    <div className="mx-auto max-w-xl p-6 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Hello, {user.name}</h1>
        <button
          onClick={() => signOut(auth)}
          className="rounded bg-gray-800 px-3 py-1.5 text-white"
        >

          Sign out
        </button>
        <a href="/profile" className="underline text-blue-600 text-sm">
            Profile
          </a>
      </header>

      {/* Add-event form */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await addEvent({ title, date, venue, uid: user.uid });
          // clear form
          setTitle("");
          setDate("");
          setVenue("");
        }}
        className="grid gap-4 border p-4 rounded"
      >
        <h2 className="font-medium">Add dummy event</h2>
        <input
          required
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <input
          required
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <input
          required
          placeholder="Venue"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <button className="rounded bg-blue-600 py-1.5 text-white">
          Save
        </button>
      </form>

      /* Event list */
    <section className="space-y-2">
      {events.map((ev) => {
        const isDtg = dtgIds.includes(ev.id);
        return (
          <div
            key={ev.id}
            className={`rounded border px-3 py-2 flex items-center justify-between ${
              isDtg ? "bg-green-50 border-green-400" : ""
            }`}
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{ev.title}</span>
              <span className="text-sm">
                {ev.venue} — {ev.date.toDate().toLocaleDateString()}
              </span>
            </div>
            <button
              onClick={() =>
                setDtgFlag({ uid: user.uid, eventId: ev.id, on: !isDtg })
              }
              className={`rounded px-2 py-1 text-sm ${
                isDtg ? "bg-green-600 text-white" : "bg-gray-200"
              }`}
            >
              ⚡ DTG
            </button>
          </div>
        );
      })}
    </section>

    </div>
  );
}
