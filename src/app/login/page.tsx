import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession, getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/User";

export const dynamic = "force-dynamic";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const currentUser = await getCurrentUser();
    if (currentUser) {
        redirect("/");
    }

    const params = await searchParams;

    async function loginAction(formData: FormData) {
        "use server";

        const username = String(formData.get("username") ?? "").trim().toLowerCase();
        const password = String(formData.get("password") ?? "");

        if (!username || !password) {
            redirect("/login?error=Invalid+credentials");
        }

        await connectDB();

        const user = await UserModel.findOne({ username });
        if (!user) {
            redirect("/login?error=Invalid+credentials");
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
            redirect("/login?error=Invalid+credentials");
        }

        await createSession(String(user._id));
        redirect("/");
    }

    return (
        <section className="auth-wrap">
            <div className="form-card">
                <h1>Login</h1>

                {params.error ? <p className="error-text">{params.error}</p> : null}

                <form className="form-grid" action={loginAction}>
                    <label>
                        Username
                        <input name="username" required maxLength={30} autoComplete="username" />
                    </label>

                    <label>
                        Password
                        <input name="password" type="password" required autoComplete="current-password" />
                    </label>

                    <button type="submit" className="button-primary">
                        Login
                    </button>
                </form>
            </div>
        </section>
    );
}
