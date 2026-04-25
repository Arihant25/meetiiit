import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/guards";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/User";

export const dynamic = "force-dynamic";

export default async function PendingPage() {
    const user = await requireAuth();

    if (user.isVerified || user.isAdmin) {
        redirect("/feed");
    }

    await connectDB();
    const freshUser = await UserModel.findById(user.id)
        .select("otp username")
        .lean<{ otp: string; username: string } | null>();

    return (
        <section className="pending-wrap">
            <div className="card">
                <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
                    Almost there
                </h1>
                <p style={{ color: "var(--ink-mid)", lineHeight: 1.6, marginBottom: 16 }}>
                    Your account is created. To get access, share your OTP with OSDG for
                    manual verification — this keeps the platform IIIT-H only.
                </p>

                <p className="muted" style={{ marginBottom: 8 }}>Your one-time code</p>
                <div className="otp-block">{freshUser?.otp ?? "------"}</div>

                <div style={{ marginTop: 20, display: "grid", gap: 8 }}>
                    <p style={{ color: "var(--ink-mid)", fontSize: "0.9rem" }}>
                        DM{" "}
                        <a
                            href="https://www.instagram.com/osdg.iiith/"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--amber)", textDecoration: "none", fontWeight: 600 }}
                        >
                            @osdg.iiith
                        </a>{" "}
                        on Instagram, or mail{" "}
                        <a
                            href="mailto:osdg@students.iiit.ac.in"
                            style={{ color: "var(--amber)", textDecoration: "none", fontWeight: 600 }}
                        >
                            osdg@students.iiit.ac.in
                        </a>{" "}
                        with this code.
                    </p>
                    <p className="muted">
                        Your username: <strong style={{ color: "var(--ink)" }}>@{freshUser?.username}</strong>
                    </p>
                </div>
            </div>
        </section>
    );
}
