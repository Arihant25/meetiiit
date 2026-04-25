import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSessionUserId } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ChatRoomModel, MessageModel } from "@/lib/models/Chat";

type RouteParams = { params: Promise<{ roomId: string }> };

type RoomDoc = { participants: mongoose.Types.ObjectId[] };
type MsgDoc = {
    _id: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    body: string;
    createdAt: Date;
};

async function authedParticipant(roomId: string) {
    const userId = await getSessionUserId();
    if (!userId || !mongoose.Types.ObjectId.isValid(roomId)) return null;

    await connectDB();
    const room = await ChatRoomModel.findById(roomId).lean<RoomDoc | null>();
    if (!room?.participants.some((p) => String(p) === userId)) return null;

    return userId;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
    const { roomId } = await params;
    const userId = await authedParticipant(roomId);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const since = req.nextUrl.searchParams.get("since");
    const query: Record<string, unknown> = { roomId: new mongoose.Types.ObjectId(roomId) };
    if (since) query.createdAt = { $gt: new Date(since) };

    const messages = await MessageModel.find(query).sort({ createdAt: 1 }).lean<MsgDoc[]>();

    return NextResponse.json(
        messages.map((m) => ({
            id: String(m._id),
            senderId: String(m.senderId),
            body: m.body,
            createdAt: m.createdAt.toISOString(),
        }))
    );
}

export async function POST(req: NextRequest, { params }: RouteParams) {
    const { roomId } = await params;
    const userId = await authedParticipant(roomId);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { body } = await req.json();
    const text = String(body ?? "").trim().slice(0, 1200);
    if (!text) return NextResponse.json({ error: "Empty message" }, { status: 400 });

    const msg = await MessageModel.create({
        roomId: new mongoose.Types.ObjectId(roomId),
        senderId: new mongoose.Types.ObjectId(userId),
        body: text,
    });

    await ChatRoomModel.updateOne(
        { _id: new mongoose.Types.ObjectId(roomId) },
        { $set: { updatedAt: new Date() } }
    );

    return NextResponse.json({
        id: String(msg._id),
        senderId: userId,
        body: msg.body,
        createdAt: (msg.createdAt as Date).toISOString(),
    });
}
