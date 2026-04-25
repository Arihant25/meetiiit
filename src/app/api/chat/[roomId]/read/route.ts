import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSessionUserId } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ChatRoomModel } from "@/lib/models/Chat";

type RouteParams = { params: Promise<{ roomId: string }> };
type RoomDoc = { participants: mongoose.Types.ObjectId[] };

export async function POST(_req: NextRequest, { params }: RouteParams) {
    const { roomId } = await params;
    const userId = await getSessionUserId();
    if (!userId || !mongoose.Types.ObjectId.isValid(roomId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const room = await ChatRoomModel.findById(roomId).lean<RoomDoc | null>();
    if (!room?.participants.some((p) => String(p) === userId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use raw collection to avoid Mongoose touching updatedAt
    await ChatRoomModel.collection.updateOne(
        { _id: new mongoose.Types.ObjectId(roomId) },
        { $set: { [`readBy.${userId}`]: new Date() } }
    );

    return NextResponse.json({ ok: true });
}
