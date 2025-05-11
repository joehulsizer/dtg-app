import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
} from "firebase/firestore";

/** Turn DTG ON or OFF for the current user.
 *  setDoc + {merge:true} will create the doc if it doesn't exist yet. */
export async function setDtgFlag(opts: {
  uid: string;
  eventId: string;
  on: boolean;
}) {
  const ref = doc(db, "users", opts.uid);
  await setDoc(
    ref,
    {
      dtg: opts.on ? arrayUnion(opts.eventId) : arrayRemove(opts.eventId),
    },
    { merge: true },      // ← create if missing, otherwise merge
  );
}


/** Live-listen to DTG list for the current user */
export function listenDtg(uid: string, cb: (eventIds: string[]) => void) {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    cb((snap.data()?.dtg as string[] | undefined) ?? []);
  });
}
