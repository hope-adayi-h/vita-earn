import { redirect } from "next/navigation";

interface PageProps {
  params: {
    username: string;
  };
}

export default function RegisterUsernamePage({ params }: PageProps) {
  const cleanUsername = (params.username || "").trim();
  redirect(`/auth/register?sponsor=${encodeURIComponent(cleanUsername)}`);
}
