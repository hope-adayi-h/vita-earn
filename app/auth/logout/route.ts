import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  cookieStore.delete("vita_test_role");
  cookieStore.delete("vita_test_user");
  cookieStore.delete("vita_test_email");
  cookieStore.delete("vita_session_user");

  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {}

  const loginUrl = new URL("/auth/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
