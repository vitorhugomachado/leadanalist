import { redirect } from "next/navigation";
import { getSessionEmail } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const email = await getSessionEmail();
  redirect(email ? "/dashboard" : "/login");
}
