"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { getClientAuth, getClientFirestore, isFirebaseConfigured } from "@/lib/firebase-client";
import type { UserProfile } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // Known synchronously at mount — not something to "wait" for via an
  // effect. If false, auth-dependent features degrade to "signed out"
  // instead of crashing the whole tree, so pages that don't touch auth
  // (home, about, jobs browse) still work.
  const [configured] = useState(isFirebaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(!configured);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForUid, setProfileForUid] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      console.error(
        "Firebase client config is missing — auth-dependent features are disabled.",
      );
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(getClientAuth(), (nextUser) => {
      setUser(nextUser);
      setAuthResolved(true);
    });
    return unsubscribeAuth;
  }, [configured]);

  useEffect(() => {
    if (!user) return;

    const ref = doc(getClientFirestore(), "users", user.uid);
    const unsubscribeProfile = onSnapshot(ref, (snap) => {
      setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
      setProfileForUid(user.uid);
    });
    return unsubscribeProfile;
  }, [user]);

  // Derived at render time, not reset via an effect, so logging out (or
  // switching users) can't flash the previous user's stale profile before
  // the new subscription resolves.
  const activeProfile = user && profileForUid === user.uid ? profile : null;
  const loading = !authResolved || (!!user && profileForUid !== user.uid);

  return (
    <AuthContext.Provider value={{ user, profile: activeProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
