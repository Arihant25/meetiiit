import mongoose from "mongoose";
import { redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/guards";
import { connectDB } from "@/lib/db";
import { ChatRoomModel, MessageModel } from "@/lib/models/Chat";
import { UserModel } from "@/lib/models/User";
import ChatRoom from "./ChatRoom";

export const dynamic = "force-dynamic";

type RoomDoc = {
    _id: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[];
};

export default async function ChatRoomPage({
    params,
}: {
    params: Promise<{ roomId: string }>;
}) {
    const currentUser = await requireVerifiedUser();
    const { roomId } = await params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) redirect("/chat");

    await connectDB();

    const room = await ChatRoomModel.findById(roomId).lean<RoomDoc | null>();
    if (!room) redirect("/chat");
    if (!room.participants.some((p) => String(p) === currentUser.id)) redirect("/chat");

    const otherId = room.participants.find((p) => String(p) !== currentUser.id);
    const otherUser = otherId
        ? await UserModel.findById(otherId)
              .select("username")
              .lean<{ username: string } | null>()
        : null;

    const messages = await MessageModel.find({
        roomId: new mongoose.Types.ObjectId(roomId),
    })
        .sort({ createdAt: 1 })
        .lean<
            {
                _id: mongoose.Types.ObjectId;
                senderId: mongoose.Types.ObjectId;
                body: string;
                createdAt: Date;
            }[]
        >();

    return (
        <ChatRoom
            roomId={roomId}
            currentUserId={currentUser.id}
            otherUsername={otherUser?.username ?? "unknown"}
            initialMessages={messages.map((m) => ({
                id: String(m._id),
                senderId: String(m.senderId),
                body: m.body,
                createdAt: m.createdAt.toISOString(),
            }))}
        />
    );
}
