import { redirect } from "next/navigation";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";

export default async function OrganizationOnboardingPage() {
  await authSessionService.getDashboardContext();
  redirect("/dashboard");
}
