import { redirect } from "next/navigation";
import { getSessionEmail } from "@/lib/session";

export default async function Home() {
  const email = await getSessionEmail();
  redirect(email ? "/dashboard" : "/login");
}
