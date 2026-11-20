import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default function RegisterRedirectPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const rawSponsor = searchParams?.sponsor || searchParams?.ref || searchParams?.upline;
  if (rawSponsor && typeof rawSponsor === "string") {
    const clean = decodeURIComponent(rawSponsor).trim().replace(/^@/, "");
    if (clean) {
      try {
        cookies().set("vita_pending_sponsor", clean, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          sameSite: "lax",
        });
      } catch {}
      redirect(`/auth/register?sponsor=${encodeURIComponent(clean)}`);
    }
  }

  // Vérifier également si un parrain est déjà mémorisé dans les cookies
  try {
    const cookieStore = cookies();
    const savedSponsor = cookieStore.get("vita_pending_sponsor")?.value;
    if (savedSponsor) {
      redirect(`/auth/register?sponsor=${encodeURIComponent(savedSponsor)}`);
    }
  } catch {}

  redirect("/auth/register");
}
