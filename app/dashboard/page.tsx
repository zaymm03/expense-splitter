import { redirect } from "next/navigation";

// The dashboard now lives at /groups.
export default function DashboardPage() {
  redirect("/groups");
}