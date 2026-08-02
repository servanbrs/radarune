import { AdminShell } from "@/features/admin/components/admin-shell";
import { SupportInbox } from "@/features/support/components/support-inbox";

export default function AdminSupportPage() {
  return <AdminShell title="Destek merkezi" description="Kullanıcılarla canlı polling tabanlı destek konuşmalarını yönetin."><SupportInbox admin /></AdminShell>;
}

