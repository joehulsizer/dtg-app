"use client";

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { setDtgFlag, listenDtg } from "@/lib/userFlags";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { listenAllUsers, UserDoc, listenFollowing } from "@/lib/userFlags";
import { addReview, listenReviews, ReviewDoc } from "@/lib/reviews";

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
  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [stars, setStars]   = useState(5);
  const [comment, setComment] = useState("");
  const [followingIds, setFollowingIds] = useState<string[]>([]);


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
  
  useEffect(() => {
    if (!event) return;
    const unsub = listenReviews(event.id, setReviews);
    return unsub;
  }, [event]);
  
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

  useEffect(() => {
    if (!uid) return;
    const unsub = listenFollowing(uid, setFollowingIds);
    return unsub;
  }, [uid]);
  

  if (!event) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span>Loading…</span>
      </div>
    );
  }
        const visibleUsers =
        followingIds.length === 0
            ? allUsers
            : allUsers.filter(
                (u) => u.uid === uid || followingIds.includes(u.uid),
            );

        const dtgCount = visibleUsers.filter((u) => u.dtg?.includes(event.id)).length;
        const recCount = visibleUsers.filter((u) =>
        u.recommended?.includes(event.artistId),
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
        {uid && (
            <form
                onSubmit={async (e) => {
                e.preventDefault();
                await addReview({ eventId: event.id, uid, stars, comment });
                setStars(5);
                setComment("");
                }}
                className="space-y-2 border-t pt-4"
            >
                <h2 className="font-medium">Leave a review</h2>
                {/* star select */}
                <select
                value={stars}
                onChange={(e) => setStars(Number(e.target.value))}
                className="border px-2 py-1 rounded"
                >
                {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                    {n} star{n > 1 && "s"}
                    </option>
                ))}
                </select>
                {/* comment */}
                <textarea
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full border rounded px-2 py-1"
                rows={3}
                placeholder="What stood out to you?"
                />
                <button className="rounded bg-blue-600 px-4 py-1.5 text-white">
                Save
                </button>
            </form>
            )}
            <section className="mt-6 space-y-4">
  {reviews.map((r) => (
    <div key={r.id} className="border-b pb-2">
      <span className="text-yellow-500">
        {"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}
      </span>
      <p className="whitespace-pre-line">{r.comment}</p>
    </div>
  ))}
</section>


    </div>
  );
}
