"use client";

// DO THIS IN THIS DOCUMENT:Primary actions (Save, Copy link, Follow, etc.) → use primary color Replace classes like bg-blue-600 with inline style: tsx Copy Edit style={{ backgroundColor: "#1B3659" }} className="rounded px-4 py-2 text-white" Badges (DTG on button) keep green/red since they convey semantics.


import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { setDtgFlag, listenDtg } from "@/lib/userFlags";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { listenAllUsers, UserDoc, listenFollowing } from "@/lib/userFlags";
import { addReview, listenReviews, ReviewDoc, deleteReview } from "@/lib/reviews";
import { ARTISTS } from "@/lib/artists";

/** Runtime type for one event (client side only) */
type EventView = {
  id: string;
  title: string;
  venue: string;
  date: string;     // formatted for display
  artistId: string;
  artistName: string;
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
  const [delMsg, setDelMsg] = useState("");

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
      const aObj = ARTISTS.find((a) => a.id === d.artistId);
      const artistName = aObj ? aObj.name : d.artistId;
      setEvent({
        id: snap.id,
        title: d.title,
        venue: d.venue,
        date: new Date(d.date.seconds * 1000).toLocaleDateString(),
        artistId: d.artistId,
        artistName: artistName,
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
        const visibleDtgUsers = visibleUsers.filter((u) =>
            u.dtg?.includes(event.id),
          );
          const visibleRecUsers = visibleUsers.filter((u) =>
            u.recommended?.includes(event.artistId),
          );
          
          

  
  return (
    <div className="mx-auto mt-6 max-w-xl bg-white rounded-lg shadow p-8 space-y-6">
      <h1 className="text-2xl font-semibold">{event.title}</h1>
      <p className="text-sm text-gray-600">
  {recCount} friends recommend&nbsp;&middot;&nbsp;{dtgCount} friends DTG
</p>
{visibleDtgUsers.length > 0 && (
  <p className="text-sm text-gray-700">
    {visibleDtgUsers
      .map((u) => u.displayName ?? u.uid.slice(0, 8))
      .join(", ")}{" "}
    {visibleDtgUsers.length === 1 ? "is" : "are"} DTG
  </p>
)}
{visibleRecUsers.length > 0 && (
  <p className="text-sm text-gray-700">
    {visibleRecUsers
      .map((u) => u.displayName ?? u.uid.slice(0, 8))
      .join(", ")}{" "}
    {visibleRecUsers.length === 1 ? "recommends" : "recommend"}{" "}
    {event.artistName}
  </p>
)}


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
                style={{ backgroundColor: "#1B3659" }}
                className="rounded px-4 py-2 text-white"
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
                <button style={{ backgroundColor: "#1B3659" }} className="rounded px-4 py-1.5 text-white">
                Save
                </button>
            </form>
            )}
            <section className="mt-6 space-y-4">
  {reviews.map((r) => {
    const mine = r.uid === uid;
    return (
      <div key={r.id} className="border-b pb-2 flex gap-2">
        <div className="flex-1">
          <span className="text-yellow-500">
            {"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}
          </span>
          <p className="whitespace-pre-line">{r.comment}</p>
        </div>

        {mine && (
          <button
            onClick={async () => {
              await deleteReview({ eventId: event.id, reviewId: r.id });
              setDelMsg("Review deleted");
              setTimeout(() => setDelMsg(""), 2000);
            }}
            style={{ backgroundColor: "#1B3659" }}
            className="self-start rounded px-2 py-1 text-white text-xs"
          >
            Delete
          </button>
        )}
      </div>
    );
  })}

  {delMsg && <span className="text-sm text-green-600">{delMsg}</span>}
</section>



    </div>
  );
}
