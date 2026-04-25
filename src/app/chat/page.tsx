import Link from "next/link";
import mongoose from "mongoose";
import { requireVerifiedUser } from "@/lib/guards";
import { connectDB } from "@/lib/db";
import { ChatRoomModel, MessageModel } from "@/lib/models/Chat";
import { UserModel } from "@/lib/models/User";

export const dynamic = "force-dynamic";

type RoomDoc = {
    _id: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[];
    updatedAt: Date;
    readBy?: Record<string, Date>;
};

export default async function ChatListPage() {
    const user = await requireVerifiedUser();
    await connectDB();

    const rooms = await ChatRoomModel.find({
        participants: new mongoose.Types.ObjectId(user.id),
    })
        .sort({ updatedAt: -1 })
        .lean<RoomDoc[]>();

    const roomItems = await Promise.all(
        rooms.map(async (room) => {
            const otherId = room.participants.find((p) => String(p) !== user.id);
            if (!otherId) return null;

            const otherUser = await UserModel.findById(otherId)
                .select("username")
                .lean<{ username: string } | null>();

            if (!otherUser) return null;

            const lastMessage = await MessageModel.findOne({ roomId: room._id })
                .sort({ createdAt: -1 })
                .select("body createdAt")
                .lean<{ body: string; createdAt: Date } | null>();

            const readAt = room.readBy?.[user.id];
            const isUnread = !!lastMessage && (!readAt || readAt < room.updatedAt);

            return {
                roomId: String(room._id),
                username: otherUser.username,
                preview: lastMessage?.body ?? "No messages yet",
                at: lastMessage?.createdAt,
                isUnread,
            };
        })
    );

    const filtered = roomItems.filter((i): i is NonNullable<typeof i> => Boolean(i));

    return (
        <section className="notes-column">
            <h1 className="page-title">Chats</h1>

            {filtered.length === 0 ? (
                <div className="card">
                    <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
                        No chats yet.{" "}
                        <Link href="/feed" style={{ color: "var(--amber)", textDecoration: "none", fontWeight: 600 }}>
                            Open a profile from the feed
                        </Link>{" "}
                        to start a conversation.
                    </p>
                </div>
            ) : (
                filtered.map((item) => (
                    <Link
                        key={item.roomId}
                        href={`/chat/${item.roomId}`}
                        style={{ textDecoration: "none" }}
                    >
                        <div className="card" style={{ display: "grid", gap: 6, transition: "border-color 0.15s" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 6 }}>
                                    @{item.username}
                                    {item.isUnread && <span className="unread-dot" aria-label="unread" />}
                                </span>
                                {item.at && (
                                    <span className="muted" style={{ fontSize: "0.78rem" }}>
                                        {new Date(item.at).toLocaleString()}
                                    </span>
                                )}
                            </div>
                            <p style={{ margin: 0, color: "var(--ink-muted)", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {item.preview}
                            </p>
                        </div>
                    </Link>
                ))
            )}
        </section>
    );
}
