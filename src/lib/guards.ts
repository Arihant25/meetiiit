import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        redirect("/login");
    }
    return user;
}

export async function requireVerifiedUser() {
    const user = await requireAuth();
    if (!user.isVerified && !user.isAdmin) {
        redirect("/pending");
    }
    return user;
}

export async function requireAdmin() {
    const user = await requireAuth();
    if (!user.isAdmin) {
        redirect("/feed");
    }
    return user;
}
