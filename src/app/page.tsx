"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { addEvent, listenEvents, EventDoc } from "@/lib/events";
import { setDtgFlag, listenDtg } from "@/lib/userFlags";
import { ARTISTS } from "@/lib/artists";
import { listenAllUsers, UserDoc, listenFollowing } from "@/lib/userFlags";
import Link from "next/link";

export default function Home() {
  const [user, setUser] = useState<{ uid: string; name: string } | null>(null);
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [dtgIds, setDtgIds] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<UserDoc[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u) setUser({ uid: u.uid, name: u.displayName ?? "Anonymous" });
      else setUser(null);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = listenEvents(setEvents);
    return unsub;          
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenDtg(user.uid, setDtgIds);
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenFollowing(user.uid, setFollowingIds);
    return unsub;
  }, [user]);
  
  useEffect(() => {
    const unsub = listenAllUsers(setAllUsers);
    return unsub;
  }, []);
  
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [artistId, setArtistId] = useState("");

  
  if (!user)
    return (
      <div className="flex h-screen items-center justify-center">
        <a href="/login" className="underline text-blue-600">
          Log in
        </a>
      </div>
    );
// ---- search logic (run on every render) -----------------
// cant read to lowercase, change the two constants below to make them work
const normalized = query.toLowerCase();
const filteredEvents = events.filter((ev) =>
  [ev.title, ev.venue, ev.artistId].some((field) =>
    field?.toLocaleLowerCase().includes(normalized.toLocaleLowerCase()) ?? false
  )
);
// ---------------------------------------------------------

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
          await addEvent({ title, date, venue, artistId, uid: user.uid });
          // clear form
          setTitle("");
          setDate("");
          setVenue("");
          setArtistId("");
        }}
        className="grid gap-4 border p-4 rounded"
      >{/* Search bar */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search events…"
        className="w-full rounded border px-3 py-2 mb-4"
      />
      
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
        <select
          required
          value={artistId}
          onChange={(e) => setArtistId(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">— choose artist —</option>
          {ARTISTS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <button className="rounded bg-blue-600 py-1.5 text-white">
          Save
        </button>
      </form>

      {/* Event list */}
      <section className="space-y-2">
        {filteredEvents.map((ev) => {
          // choose which users to include
          const visibleUsers =
          followingIds.length === 0
            ? allUsers
            : allUsers.filter(
                (u) => u.uid === user.uid || followingIds.includes(u.uid),
              );

          const dtgCount = visibleUsers.filter((u) => u.dtg?.includes(ev.id)).length;
          const recCount = visibleUsers.filter((u) =>
          u.recommended?.includes(ev.artistId),
          ).length;


          const isDtg = dtgIds.includes(ev.id);
          
        return (
          <div
            key={ev.id}
            className={`rounded-lg px-4 py-3 flex items-center justify-between shadow-sm transition hover:shadow-lg bg-white border ${
              isDtg ? "border-green-400" : "border-gray-200"
            }`}
            
          >
            <div className="flex flex-col">
            <Link
              href={`/event/${ev.id}`}
              className="font-medium underline-offset-2 hover:underline"
            >
              {ev.title}
            </Link>
            <span className="text-sm">
                {ev.venue} — {ev.date.toDate().toLocaleDateString()}
              </span>
            <span className="text-xs text-gray-600">
              {recCount} friends recommend&nbsp;&middot;&nbsp;{dtgCount} friends DTG
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
