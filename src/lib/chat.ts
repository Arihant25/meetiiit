import mongoose from "mongoose";
import { ChatRoomModel, MessageModel } from "@/lib/models/Chat";

export async function getOrCreateRoom(userAId: string, userBId: string) {
    const a = new mongoose.Types.ObjectId(userAId);
    const b = new mongoose.Types.ObjectId(userBId);

    const existing = await ChatRoomModel.findOne({
        participants: { $all: [a, b], $size: 2 },
    })
        .select("_id")
        .lean<{ _id: mongoose.Types.ObjectId } | null>();

    if (existing) {
        return String(existing._id);
    }

    const room = await ChatRoomModel.create({ participants: [a, b] });
    return String(room._id);
}

export async function deleteRoomsForUser(userId: string) {
    const uid = new mongoose.Types.ObjectId(userId);

    const rooms = await ChatRoomModel.find({ participants: uid })
        .select("_id")
        .lean<{ _id: mongoose.Types.ObjectId }[]>();

    if (!rooms.length) {
        return;
    }

    const roomIds = rooms.map((r) => r._id);
    await MessageModel.deleteMany({ roomId: { $in: roomIds } });
    await ChatRoomModel.deleteMany({ _id: { $in: roomIds } });
}
