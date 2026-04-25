import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <section className="landing">
        <div className="landing-card">
          <div className="landing-logo-wrap">
            <Image
              src="/osdglogo.webp"
              alt="OSDG logo"
              width={80}
              height={80}
              style={{ width: 80, height: "auto" }}
              className="landing-logo"
              priority
            />
          </div>
          <h1>MeetIIIT</h1>
          <p>
            Anonymous connections for IIIT-H students. Share interests, find
            your people.
          </p>
          <div className="landing-actions">
            <Link className="button-primary" href="/signup">
              Create account
            </Link>
            <Link className="button-secondary" href="/login">
              Login
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!user.isVerified && !user.isAdmin) {
    redirect("/pending");
  }

  redirect("/feed");
}
