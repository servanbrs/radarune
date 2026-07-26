import type { Metadata } from "next";
import { InstallWizard } from "@/features/platform/components/install-wizard";
import { installService } from "@/features/platform/server/services/install.service";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Radarune kurulumu",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function InstallPage() {
  const status = await installService.getBootstrapStatus();

  if (status.organizationCount !== null && status.organizationCount > 0) {
    redirect("/sign-in");
  }

  return <InstallWizard status={status} />;
}
