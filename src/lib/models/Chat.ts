import { Schema, model, models } from "mongoose";

const chatRoomSchema = new Schema(
    {
        participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
        readBy: { type: Map, of: Date, default: () => ({}) },
    },
    { timestamps: true }
);

chatRoomSchema.index({ participants: 1 });

const messageSchema = new Schema(
    {
        roomId: { type: Schema.Types.ObjectId, ref: "ChatRoom", required: true, index: true },
        senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        body: { type: String, required: true, trim: true, maxlength: 1200 },
    },
    { timestamps: true }
);

export const ChatRoomModel = models.ChatRoom || model("ChatRoom", chatRoomSchema);
export const MessageModel = models.Message || model("Message", messageSchema);
