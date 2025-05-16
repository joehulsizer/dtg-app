import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  collection,
  getDoc,
  deleteDoc,
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

/** Turn RECOMMENDED ON or OFF for the current user */
export async function setRecommendFlag(opts: {
    uid: string;
    artistId: string;
    on: boolean;
  }) {
    const ref = doc(db, "users", opts.uid);
    await setDoc(
      ref,
      {
        recommended: opts.on
          ? arrayUnion(opts.artistId)
          : arrayRemove(opts.artistId),
      },
      { merge: true },
    );
  }
  
  /** Live-listen to recommended list for the current user */
  export function listenRecommended(
    uid: string,
    cb: (artistIds: string[]) => void,
  ) {
    return onSnapshot(doc(db, "users", uid), (snap) => {
      cb((snap.data()?.recommended as string[] | undefined) ?? []);
    });
  }
  
  /** Toggle follow ↔ unfollow  */
export async function toggleFollow(opts: {
  uid: string;        // current user
  targetUid: string;  // person to follow/unfollow
}) {
  const ref = doc(db, "users", opts.uid, "following", opts.targetUid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);       // unfollow
  } else {
    await setDoc(ref, { t: true });  // follow
  }
}

/** Live-listen to current user's following list */
export function listenFollowing(
  uid: string,
  cb: (ids: string[]) => void,
) {
  return onSnapshot(
    collection(db, "users", uid, "following"),
    (snap) => cb(snap.docs.map((d) => d.id)),
  );
}

  /** Listen to *all* users (tiny data set, fine for MVP) */
  export function listenAllUsers(cb: (users: UserDoc[]) => void) {
    return onSnapshot(collection(db, "users"), (snap) => {
      cb(
        snap.docs.map((d) => ({
          uid: d.id,
          ...(d.data() as Omit<UserDoc, "uid">),
        })),
      );
    });
  }
  export type UserDoc = {
    uid: string;
    dtg?: string[];
    recommended?: string[];
  };


    
