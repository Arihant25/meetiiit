import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { clearSession } from "@/lib/auth";
import { requireVerifiedUser } from "@/lib/guards";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/User";
import { deleteUserAndData } from "@/lib/user-maintenance";
import ThemeToggle from "@/app/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; ok?: string }>;
}) {
    const user = await requireVerifiedUser();
    const params = await searchParams;

    async function changePasswordAction(formData: FormData) {
        "use server";

        const currentPassword = String(formData.get("currentPassword") ?? "");
        const newPassword = String(formData.get("newPassword") ?? "");
        const confirmPassword = String(formData.get("confirmPassword") ?? "");

        if (!currentPassword || !newPassword || !confirmPassword) {
            redirect("/settings?error=Fill+all+password+fields");
        }

        if (newPassword.length < 8) {
            redirect("/settings?error=New+password+must+be+at+least+8+characters");
        }

        if (newPassword !== confirmPassword) {
            redirect("/settings?error=Passwords+do+not+match");
        }

        await connectDB();

        const dbUser = await UserModel.findById(user.id).select("passwordHash");
        if (!dbUser) redirect("/login");

        const ok = await bcrypt.compare(currentPassword, dbUser.passwordHash);
        if (!ok) redirect("/settings?error=Current+password+is+incorrect");

        dbUser.passwordHash = await bcrypt.hash(newPassword, 10);
        await dbUser.save();

        redirect("/settings?ok=1");
    }

    async function deleteAccountAction() {
        "use server";
        await connectDB();
        await deleteUserAndData(user.id);
        await clearSession();
    }

    return (
        <section className="notes-column">
            <h1 className="page-title">Settings</h1>

            <div className="card form-grid">
                <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                    Appearance
                </h2>
                <p className="muted">Auto follows your device setting.</p>
                <ThemeToggle />
            </div>

            {params.error ? <p className="error-text">{params.error}</p> : null}
            {params.ok ? <p className="success-text">Password updated.</p> : null}

            <div className="card form-grid">
                <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                    Change password
                </h2>
                <form className="form-grid" action={changePasswordAction}>
                    <label>
                        Current password
                        <input type="password" name="currentPassword" required autoComplete="current-password" />
                    </label>
                    <label>
                        New password
                        <input type="password" name="newPassword" required minLength={8} autoComplete="new-password" />
                    </label>
                    <label>
                        Confirm new password
                        <input type="password" name="confirmPassword" required minLength={8} autoComplete="new-password" />
                    </label>
                    <button type="submit" className="button-primary">
                        Save password
                    </button>
                </form>
            </div>

            <div className="card form-grid">
                <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                    Delete account
                </h2>
                <p className="muted">Permanently deletes your profile and all chat history.</p>
                <form action={deleteAccountAction}>
                    <button type="submit" className="button-danger">
                        Delete my account
                    </button>
                </form>
            </div>
        </section>
    );
}
