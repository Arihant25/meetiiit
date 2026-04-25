"use client";
import { useState } from "react";
import Link from "next/link";

interface NavMenuProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  logoutAction?: () => Promise<void>;
  hasUnreadChats?: boolean;
}

export default function NavMenu({ isLoggedIn, isAdmin, logoutAction, hasUnreadChats }: NavMenuProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        className={`hamburger${open ? " hamburger-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>

      {open && <div className="nav-backdrop" onClick={close} />}

      <nav className={`nav-links${open ? " nav-open" : ""}`}>
        {isLoggedIn ? (
          <>
            <Link href="/feed" onClick={close}>Feed</Link>
            <Link href="/chat" onClick={close} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              Chats{hasUnreadChats && <span className="unread-dot" aria-label="unread messages" />}
            </Link>
            <Link href="/profile" onClick={close}>Profile</Link>
            <Link href="/settings" onClick={close}>Settings</Link>
            {isAdmin && <Link href="/admin" onClick={close}>Admin</Link>}
            <form action={logoutAction}>
              <button type="submit" className="linklike">Logout</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" onClick={close}>Login</Link>
            <Link href="/signup" onClick={close}>Sign up</Link>
          </>
        )}
      </nav>
    </>
  );
}
