import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  cookieStore.delete("vita_test_role");
  cookieStore.delete("vita_test_user");
  cookieStore.delete("vita_test_email");
  cookieStore.delete("vita_session_user");
  cookieStore.delete("vita_account_activated");
  cookieStore.delete("vita_admin_unlocked");
  cookieStore.delete("vita_accounts");
  cookieStore.set("vita_logged_out", "true", {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
  });

  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {}

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "vita-earn.netlify.app";
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const targetHost = host.includes("netlify.app") ? "vita-earn.netlify.app" : host;
  const loginUrl = new URL("/auth/login", `${protocol}://${targetHost}`);

  const res = NextResponse.redirect(loginUrl);
  res.cookies.delete("vita_test_role");
  res.cookies.delete("vita_test_user");
  res.cookies.delete("vita_test_email");
  res.cookies.delete("vita_session_user");
  res.cookies.delete("vita_account_activated");
  res.cookies.delete("vita_admin_unlocked");
  res.cookies.delete("vita_accounts");
  res.cookies.set("vita_logged_out", "true", {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function POST(request: NextRequest) {
  return GET(request);
}
