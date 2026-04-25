import mongoose from "mongoose";

type GlobalMongoose = {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
    __mongoose?: GlobalMongoose;
};

const cached: GlobalMongoose =
    globalForMongoose.__mongoose ?? { conn: null, promise: null };

globalForMongoose.__mongoose = cached;

export async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI is not set");
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(uri, {
            dbName: process.env.MONGODB_DB ?? "meetiiit",
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
