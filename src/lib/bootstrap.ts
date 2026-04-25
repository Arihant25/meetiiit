import "server-only";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/User";

const globalState = globalThis as typeof globalThis & {
    __meetiiitAdminBootstrapped?: boolean;
};

export async function ensureAdminInitialized() {
    if (globalState.__meetiiitAdminBootstrapped) {
        return;
    }

    await connectDB();

    const existingOsdg = await UserModel.findOne({ username: "osdg" })
        .select("_id isAdmin")
        .lean<{ _id: string; isAdmin: boolean } | null>();

    if (!existingOsdg) {
        const generatedPassword = randomBytes(9).toString("base64url");
        const passwordHash = await bcrypt.hash(generatedPassword, 10);

        try {
            await UserModel.create({
                name: "OSDG Admin",
                batch: "SYSTEM",
                username: "osdg",
                passwordHash,
                tags: [],
                about: "Admin account for manual verification",
                isVerified: true,
                isAdmin: true,
                isHidden: true,
                otp: "000000",
            });

            console.log("[MeetIIIT] Admin account created");
            console.log("[MeetIIIT] Username: osdg");
            console.log(`[MeetIIIT] Password: ${generatedPassword}`);
        } catch (error: unknown) {
            const mongoError = error as { code?: number };
            if (mongoError.code !== 11000) {
                throw error;
            }
        }
    } else if (!existingOsdg.isAdmin) {
        await UserModel.updateOne(
            { _id: existingOsdg._id },
            { $set: { isAdmin: true, isVerified: true, isHidden: true } }
        );
    }

    globalState.__meetiiitAdminBootstrapped = true;
}
