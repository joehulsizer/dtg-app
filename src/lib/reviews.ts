import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

type ReviewData = Omit<ReviewDoc, "id">;

export type ReviewDoc = {
  id: string;
  uid: string;
  stars: number;       // 1-5
  comment: string;
  createdAt: Timestamp;
};

/** Write a review */
export async function addReview(opts: {
  eventId: string;
  uid: string;
  stars: number;
  comment: string;
}) {
  await addDoc(collection(db, "events", opts.eventId, "reviews"), {
    ...opts,
    createdAt: new Date(),
  });
}

/** Live-listen to all reviews for an event */
export function listenReviews(
  eventId: string,
  cb: (reviews: ReviewDoc[]) => void,
) {
  return onSnapshot(
    query(
      collection(db, "events", eventId, "reviews"),
      orderBy("createdAt", "desc"),
    ),
    (snap) => {
      cb(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as ReviewData) })),
      );
    },
  );
}
