import Link from "next/link";
import { redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/guards";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/User";

function normalizeTags(raw: string) {
    return Array.from(
        new Set(
            raw
                .split(",")
                .map((t) => t.trim().toLowerCase())
                .filter(Boolean)
        )
    ).slice(0, 5);
}

export const dynamic = "force-dynamic";

export default async function ProfilePage({
    searchParams,
}: {
    searchParams: Promise<{ ok?: string }>;
}) {
    const user = await requireVerifiedUser();
    const params = await searchParams;

    await connectDB();

    const profile = await UserModel.findById(user.id)
        .select("username tags about")
        .lean<{ username: string; tags: string[]; about: string } | null>();

    if (!profile) {
        redirect("/login");
    }

    async function updateProfileAction(formData: FormData) {
        "use server";

        const tags = normalizeTags(String(formData.get("tags") ?? ""));
        const about = String(formData.get("about") ?? "").trim().slice(0, 1200);

        await connectDB();
        await UserModel.findByIdAndUpdate(user.id, { tags, about });
        redirect("/profile?ok=1");
    }

    return (
        <section className="auth-wrap">
            <div className="form-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <h1>Your profile</h1>
                    <Link href={`/u/${profile.username}`} className="button-secondary" style={{ fontSize: "0.82rem", padding: "6px 12px", whiteSpace: "nowrap" }}>
                        View public profile →
                    </Link>
                </div>

                {params.ok ? <p className="success-text">Saved.</p> : null}

                <form className="form-grid" action={updateProfileAction}>
                    <label>
                        Username
                        <input value={profile.username} disabled />
                    </label>

                    <label>
                        Interest tags
                        <input
                            name="tags"
                            defaultValue={profile.tags.join(", ")}
                            maxLength={200}
                            placeholder="skydiving, gardening, cooking (max 5, comma separated)"
                        />
                    </label>

                    <label>
                        What I wanna say
                        <textarea
                            name="about"
                            rows={8}
                            defaultValue={profile.about}
                            maxLength={1200}
                            placeholder="Write anything — Markdown supported"
                        />
                    </label>

                    <button className="button-primary" type="submit">
                        Save
                    </button>
                </form>
            </div>
        </section>
    );
}
