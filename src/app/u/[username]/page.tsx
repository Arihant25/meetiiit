import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/User";
import { requireVerifiedUser } from "@/lib/guards";
import { getOrCreateRoom } from "@/lib/chat";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const viewer = await requireVerifiedUser();
    const { username } = await params;

    await connectDB();

    const profile = await UserModel.findOne({
        username: username.toLowerCase(),
        isVerified: true,
        isHidden: false,
        isAdmin: false,
    })
        .select("_id username tags about")
        .lean<{
            _id: string;
            username: string;
            tags: string[];
            about: string;
        } | null>();

    if (!profile) {
        return (
            <section className="notes-column">
                <div className="card">
                    <p style={{ color: "var(--ink-mid)", marginBottom: 14 }}>Profile not found.</p>
                    <Link className="button-secondary" href="/feed">
                        ← Back to feed
                    </Link>
                </div>
            </section>
        );
    }

    const profileId = String(profile._id);

    async function startChatAction() {
        "use server";
        if (profileId === viewer.id) redirect("/chat");
        const roomId = await getOrCreateRoom(viewer.id, profileId);
        redirect(`/chat/${roomId}`);
    }

    const isSelf = profileId === viewer.id;

    return (
        <section className="notes-column">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <Link href="/feed" className="button-secondary" style={{ fontSize: "0.82rem", padding: "6px 12px" }}>
                    ← Feed
                </Link>
            </div>

            <div className="card" style={{ display: "grid", gap: 16 }}>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
                    @{profile.username}
                </h1>

                {profile.tags.length > 0 && (
                    <div className="chip-row">
                        {profile.tags.map((tag) => (
                            <span key={tag} className="chip">#{tag}</span>
                        ))}
                    </div>
                )}

                <div className="markdown-body">
                    <ReactMarkdown>{profile.about || "_No intro yet._"}</ReactMarkdown>
                </div>

                {!isSelf && (
                    <form action={startChatAction}>
                        <button type="submit" className="button-primary">
                            Reply privately →
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
}
