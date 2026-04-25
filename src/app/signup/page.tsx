import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/User";
import { createSession, getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SignupPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const currentUser = await getCurrentUser();
    if (currentUser) {
        redirect("/");
    }

    const params = await searchParams;

    async function signupAction(formData: FormData) {
        "use server";

        const name = String(formData.get("name") ?? "").trim();
        const batch = String(formData.get("batch") ?? "").trim();
        const username = String(formData.get("username") ?? "").trim().toLowerCase();
        const password = String(formData.get("password") ?? "");

        if (!name || !batch || !username || !password) {
            redirect("/signup?error=Please+fill+all+fields");
        }

        if (!/^[a-z0-9_]{3,30}$/.test(username)) {
            redirect("/signup?error=Username+must+be+3–30+chars+(letters,+numbers,+_)");
        }

        if (password.length < 8) {
            redirect("/signup?error=Password+must+be+at+least+8+characters");
        }

        await connectDB();

        const existing = await UserModel.findOne({ username }).select("_id").lean();
        if (existing) {
            redirect("/signup?error=Username+already+taken");
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await UserModel.create({
            name,
            batch,
            username,
            passwordHash,
            tags: [],
            about: "",
            otp,
            isVerified: false,
            isAdmin: false,
            isHidden: false,
        });

        await createSession(String(user._id));
        redirect("/pending");
    }

    return (
        <section className="auth-wrap">
            <div className="form-card">
                <h1>Create account</h1>
                <p className="muted">
                    Name and batch are only used for verification — never shown publicly.
                </p>

                {params.error ? <p className="error-text">{params.error}</p> : null}

                <form className="form-grid" action={signupAction}>
                    <label>
                        Full name
                        <input name="name" required maxLength={120} autoComplete="name" />
                    </label>

                    <label>
                        Batch
                        <input name="batch" required maxLength={30} placeholder="e.g. UG2026" />
                    </label>

                    <label>
                        Username
                        <input
                            name="username"
                            required
                            minLength={3}
                            maxLength={30}
                            placeholder="your_handle"
                            autoComplete="username"
                        />
                    </label>

                    <label>
                        Password
                        <input
                            name="password"
                            type="password"
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </label>

                    <button type="submit" className="button-primary">
                        Create account
                    </button>
                </form>
            </div>
        </section>
    );
}
