import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/User";

const SESSION_COOKIE = "meetiiit_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

type SessionPayload = {
    uid: string;
    exp: number;
};

function getSessionSecret() {
    return process.env.SESSION_SECRET ?? "dev-only-secret-change-me";
}

function toBase64Url(input: string) {
    return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string) {
    return Buffer.from(input, "base64url").toString("utf8");
}

function sign(data: string) {
    return createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
}

function encodeSession(payload: SessionPayload) {
    const encoded = toBase64Url(JSON.stringify(payload));
    const signature = sign(encoded);
    return `${encoded}.${signature}`;
}

function decodeSession(value: string): SessionPayload | null {
    const [encoded, signature] = value.split(".");
    if (!encoded || !signature) {
        return null;
    }

    const expected = sign(encoded);
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (sigBuffer.length !== expectedBuffer.length) {
        return null;
    }

    if (!timingSafeEqual(sigBuffer, expectedBuffer)) {
        return null;
    }

    try {
        const payload = JSON.parse(fromBase64Url(encoded)) as SessionPayload;
        if (!payload.uid || !payload.exp || Date.now() > payload.exp) {
            return null;
        }
        return payload;
    } catch {
        return null;
    }
}

export async function createSession(userId: string) {
    const payload: SessionPayload = { uid: userId, exp: Date.now() + SESSION_TTL_MS };
    const token = encodeSession(payload);
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(payload.exp),
    });
}

export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    redirect("/login");
}

export async function getSessionUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) {
        return null;
    }

    const payload = decodeSession(token);
    return payload?.uid ?? null;
}

export async function getCurrentUser() {
    const userId = await getSessionUserId();
    if (!userId) {
        return null;
    }

    await connectDB();

    const user = await UserModel.findById(userId)
        .select("_id username isAdmin isVerified isHidden")
        .lean<{
            _id: string;
            username: string;
            isAdmin: boolean;
            isVerified: boolean;
            isHidden: boolean;
        } | null>();

    if (!user) {
        return null;
    }

    return {
        id: String(user._id),
        username: user.username,
        isAdmin: Boolean(user.isAdmin),
        isVerified: Boolean(user.isVerified),
        isHidden: Boolean(user.isHidden),
    };
}
