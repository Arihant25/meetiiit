import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/guards";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/User";
import { deleteUserAndData } from "@/lib/user-maintenance";

export const dynamic = "force-dynamic";

type AdminUser = {
    _id: string;
    username: string;
    batch: string;
    isVerified: boolean;
    isHidden: boolean;
    otp: string;
    createdAt: Date;
};

export default async function AdminPage() {
    await requireAdmin();
    await connectDB();

    const pending = await UserModel.find({ isAdmin: false, isVerified: false })
        .sort({ createdAt: 1 })
        .select("username batch otp createdAt isVerified isHidden")
        .lean<AdminUser[]>();

    const users = await UserModel.find({ isAdmin: false })
        .sort({ createdAt: -1 })
        .select("username batch otp createdAt isVerified isHidden")
        .lean<AdminUser[]>();

    async function approveAction(formData: FormData) {
        "use server";
        const userId = String(formData.get("userId") ?? "");
        await connectDB();
        await UserModel.findByIdAndUpdate(userId, { $set: { isVerified: true } });
        redirect("/admin");
    }

    async function rejectAction(formData: FormData) {
        "use server";
        const userId = String(formData.get("userId") ?? "");
        await connectDB();
        await deleteUserAndData(userId);
        redirect("/admin");
    }

    async function toggleHideAction(formData: FormData) {
        "use server";
        const userId = String(formData.get("userId") ?? "");
        const hide = String(formData.get("hide") ?? "") === "1";
        await connectDB();
        await UserModel.findByIdAndUpdate(userId, { $set: { isHidden: hide } });
        redirect("/admin");
    }

    async function deleteAction(formData: FormData) {
        "use server";
        const userId = String(formData.get("userId") ?? "");
        await connectDB();
        await deleteUserAndData(userId);
        redirect("/admin");
    }

    return (
        <section className="notes-column">
            <h1 className="page-title">Admin</h1>

            <div className="card">
                <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--ink)", margin: "0 0 4px" }}>
                    Pending verification
                </h2>
                {pending.length === 0 ? (
                    <p className="muted" style={{ marginTop: 8 }}>No pending users.</p>
                ) : (
                    pending.map((u) => (
                        <div key={u._id} className="admin-row">
                            <div>
                                <p style={{ margin: 0, fontWeight: 600, color: "var(--ink)", fontSize: "0.9rem" }}>
                                    @{u.username}{" "}
                                    <span style={{ color: "var(--ink-muted)", fontWeight: 400 }}>({u.batch})</span>
                                </p>
                                <p className="muted">OTP: {u.otp}</p>
                            </div>
                            <div className="row-actions">
                                <form action={approveAction}>
                                    <input type="hidden" name="userId" value={u._id} />
                                    <button className="button-primary" type="submit">Approve</button>
                                </form>
                                <form action={rejectAction}>
                                    <input type="hidden" name="userId" value={u._id} />
                                    <button className="button-danger" type="submit">Reject</button>
                                </form>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="card">
                <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--ink)", margin: "0 0 4px" }}>
                    All users
                </h2>
                {users.map((u) => (
                    <div key={u._id} className="admin-row">
                        <div>
                            <p style={{ margin: 0, fontWeight: 600, color: "var(--ink)", fontSize: "0.9rem" }}>
                                @{u.username}{" "}
                                <span style={{ color: "var(--ink-muted)", fontWeight: 400 }}>({u.batch})</span>
                            </p>
                            <p className="muted">
                                {u.isVerified ? "Verified" : "Pending"} · {u.isHidden ? "Hidden" : "Visible"}
                            </p>
                        </div>
                        <div className="row-actions">
                            <form action={toggleHideAction}>
                                <input type="hidden" name="userId" value={u._id} />
                                <input type="hidden" name="hide" value={u.isHidden ? "0" : "1"} />
                                <button className="button-secondary" type="submit">
                                    {u.isHidden ? "Unhide" : "Hide"}
                                </button>
                            </form>
                            <form action={deleteAction}>
                                <input type="hidden" name="userId" value={u._id} />
                                <button className="button-danger" type="submit">Delete</button>
                            </form>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
