import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { requireVerifiedUser } from "@/lib/guards";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/User";
import { getOrCreateRoom } from "@/lib/chat";
import { redirect } from "next/navigation";
import ProfileModal from "@/app/components/ProfileModal";
import SearchInput from "./SearchInput";

export const dynamic = "force-dynamic";

function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type Search = {
    q?: string;
    sort?: "new" | "old";
    u?: string;
};

type FeedUser = {
    _id: string;
    username: string;
    tags: string[];
    about: string;
    createdAt: Date;
};

export default async function FeedPage({
    searchParams,
}: {
    searchParams: Promise<Search>;
}) {
    const currentUser = await requireVerifiedUser();
    const params = await searchParams;

    await connectDB();

    const q = params.q?.trim() ?? "";
    const sort = params.sort === "old" ? "old" : "new";
    const selectedUsername = params.u?.trim().toLowerCase();

    const baseFilter = { isVerified: true, isHidden: false, isAdmin: false } as const;
    const query = q
        ? {
              ...baseFilter,
              $or: [
                  { username: { $regex: escapeRegex(q), $options: "i" } },
                  { about: { $regex: escapeRegex(q), $options: "i" } },
                  { tags: { $regex: escapeRegex(q), $options: "i" } },
              ],
          }
        : baseFilter;

    const [users, myProfile] = await Promise.all([
        UserModel.find(query)
            .sort({ createdAt: sort === "old" ? 1 : -1 })
            .select("username tags about createdAt")
            .lean<FeedUser[]>(),
        UserModel.findById(currentUser.id).select("tags about").lean<{ tags: string[]; about: string } | null>(),
    ]);

    const selectedUser = selectedUsername
        ? users.find((u) => u.username === selectedUsername) ?? null
        : null;

    const showModal = !myProfile?.tags?.length && !myProfile?.about;

    function feedHref(opts: { q?: string | null; sort?: string; u?: string | null }) {
        const p = new URLSearchParams();
        p.set("sort", opts.sort ?? sort);
        if (opts.q ?? q) p.set("q", opts.q ?? q);
        if (opts.u) p.set("u", opts.u);
        return `/feed?${p.toString()}`;
    }

    async function startChatAction(formData: FormData) {
        "use server";
        const profileId = String(formData.get("profileId") ?? "");
        if (!profileId || profileId === currentUser.id) {
            redirect("/chat");
        }
        const roomId = await getOrCreateRoom(currentUser.id, profileId);
        redirect(`/chat/${roomId}`);
    }

    return (
        <>
            {showModal && <ProfileModal />}

            <div className={`notes-shell${selectedUser ? " detail-view" : ""}`}>
                {/* ── Left: list panel ── */}
                <div className="notes-list">
                    <div className="notes-list-head">
                        <div className="notes-list-head-row">
                            <Link
                                className={`chip${sort === "new" ? " active" : ""}`}
                                href={feedHref({ sort: "new", u: selectedUsername })}
                            >
                                New
                            </Link>
                            <Link
                                className={`chip${sort === "old" ? " active" : ""}`}
                                href={feedHref({ sort: "old", u: selectedUsername })}
                            >
                                Old
                            </Link>
                        </div>
                        <SearchInput sort={sort} />
                    </div>

                    <div className="notes-list-scroll">
                        {users.length === 0 ? (
                            <p className="notes-list-empty">No profiles match this filter.</p>
                        ) : (
                            users.map((u) => (
                                <Link
                                    key={String(u._id)}
                                    href={feedHref({ sort, u: u.username })}
                                    className={`notes-list-item${selectedUsername === u.username ? " active" : ""}`}
                                >
                                    <div className="notes-list-item-name">@{u.username}</div>
                                    <div className="notes-list-item-preview">
                                        {u.about?.trim() || (u.tags.length ? u.tags.map((t) => `#${t}`).join(" ") : "No intro yet")}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Right: detail panel ── */}
                <div className="notes-detail">
                    {selectedUser ? (
                        <div className="notes-detail-scroll">
                            <div className="notes-detail-actions">
                                <Link
                                    href={feedHref({ sort })}
                                    className="button-secondary mobile-back"
                                >
                                    ← Back
                                </Link>
                            </div>

                            <h1 className="notes-detail-name">@{selectedUser.username}</h1>

                            {selectedUser.tags.length > 0 && (
                                <div className="chip-row">
                                    {selectedUser.tags.map((tag) => (
                                        <span key={tag} className="chip">#{tag}</span>
                                    ))}
                                </div>
                            )}

                            <div className="markdown-body">
                                <ReactMarkdown>
                                    {selectedUser.about?.trim() || "_No intro yet._"}
                                </ReactMarkdown>
                            </div>

                            {selectedUser.username !== currentUser.username && (
                                <form action={startChatAction}>
                                    <input type="hidden" name="profileId" value={String(selectedUser._id)} />
                                    <button type="submit" className="button-primary">
                                        Reply privately →
                                    </button>
                                </form>
                            )}
                        </div>
                    ) : (
                        <div className="notes-empty">
                            Select a person from the list
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
