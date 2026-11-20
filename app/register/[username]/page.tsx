import { redirect } from "next/navigation";
import { cookies } from "next/headers";

interface PageProps {
  params: {
    username: string;
  };
}

export default function RegisterUsernamePage({ params }: PageProps) {
  const cleanUsername = decodeURIComponent(params.username || "").trim().replace(/^@/, "");
  if (cleanUsername) {
    try {
      cookies().set("vita_pending_sponsor", cleanUsername, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
    } catch {}
    redirect(`/auth/register?sponsor=${encodeURIComponent(cleanUsername)}`);
  }
  redirect("/auth/register");
}
