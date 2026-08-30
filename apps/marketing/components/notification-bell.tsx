"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, writeBatch } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase-client";
import type { Notification } from "@/lib/types";

const MAX_NOTIFICATIONS = 25;

export function NotificationBell({ uid }: { uid: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(getClientFirestore(), "users", uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(MAX_NOTIFICATIONS),
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Notification));
    });
    return unsubscribe;
  }, [uid]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markRead(id: string) {
    await updateDoc(doc(getClientFirestore(), "users", uid, "notifications", id), { read: true });
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(getClientFirestore());
    unread.forEach((n) => {
      batch.update(doc(getClientFirestore(), "users", uid, "notifications", n.id), { read: true });
    });
    await batch.commit();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border-strong text-ink transition-colors hover:border-tide cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M18 16v-5a6 6 0 1 0-12 0v5l-1.5 2.5h15L18 16Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M10 21a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gorse px-1 font-mono text-[10px] font-semibold text-paper">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-paper shadow-[0_8px_24px_rgba(18,33,30,0.12)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-tide underline hover:text-tide-bright cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-granite-soft">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => {
                    if (!n.read) void markRead(n.id);
                    setOpen(false);
                  }}
                  className={`block border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-paper-raised ${
                    n.read ? "" : "bg-tide/5"
                  }`}
                >
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  <p className="mt-0.5 text-xs text-granite">{n.body}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
