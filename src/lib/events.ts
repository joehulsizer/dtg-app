// src/lib/events.ts
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

export type EventDoc = {
  id: string;
  title: string;
  date: Timestamp;
  venue: string;
  createdByUid: string;
};

/** Add a new event */
export async function addEvent(opts: {
  title: string;
  date: string;   // "YYYY-MM-DD"
  venue: string;
  uid: string;
}) {
  await addDoc(collection(db, "events"), {
    ...opts,
    date: new Date(opts.date),      // convert to JS Date → Firestore Timestamp
    createdAt: serverTimestamp(),
  });
}

/** Real-time listener (calls cb every time data changes) */
export function listenEvents(cb: (events: EventDoc[]) => void) {
  return onSnapshot(
    query(collection(db, "events"), orderBy("date")),
    (snap) => {
      const evts = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as EventDoc),
      }));
      cb(evts);
    },
  );
}
