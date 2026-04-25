import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import mongoose from "mongoose";
import "./globals.css";
import { clearSession, getCurrentUser } from "@/lib/auth";
import { ensureAdminInitialized } from "@/lib/bootstrap";
import { connectDB } from "@/lib/db";
import { ChatRoomModel } from "@/lib/models/Chat";
import ThemeScript from "@/app/components/ThemeScript";
import NavMenu from "@/app/components/NavMenu";

export const metadata: Metadata = {
  title: "MeetIIIT",
  description: "Anonymous IIIT-H meetup app",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await ensureAdminInitialized();
  const user = await getCurrentUser();

  let hasUnreadChats = false;
  if (user) {
    try {
      await connectDB();
      const rooms = await ChatRoomModel.find(
        { participants: new mongoose.Types.ObjectId(user.id) }
      ).select("updatedAt readBy").lean<Array<{ updatedAt: Date; readBy?: Record<string, Date> }>>();
      hasUnreadChats = rooms.some((room) => {
        const readAt = room.readBy?.[user.id];
        return !readAt || readAt < room.updatedAt;
      });
    } catch {
      // fail silently
    }
  }

  async function logoutAction() {
    "use server";
    await clearSession();
  }

  return (
    <html lang="en">
      <head>
        <ThemeScript />
      </head>
      <body className="app-shell">
        <header className="topbar">
          <div className="topbar-inner">
            <Link className="brand" href="/">
              <Image
                src="/logo.png"
                alt="Friends icon"
                width={20}
                height={20}
                className="brand-logo"
              />
              <span className="brand-text">MeetIIIT</span>
            </Link>
            <NavMenu
              isLoggedIn={!!user}
              isAdmin={!!user?.isAdmin}
              hasUnreadChats={hasUnreadChats}
              logoutAction={user ? logoutAction : undefined}
            />
          </div>
        </header>
        <main className="page-wrap">{children}</main>
      </body>
    </html>
  );
}
