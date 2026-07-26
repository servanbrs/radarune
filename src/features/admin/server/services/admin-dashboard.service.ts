import "server-only";
import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { adminDashboardRepository } from "@/features/admin/server/repositories/admin-dashboard.repository";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";

export class AdminDashboardService {
  async getDashboard(actor: FinanceActorContext) {
    assertAdminPermission(actor, "admin.dashboard.view");
    return adminDashboardRepository.getStats(actor.organizationId);
  }
}

export const adminDashboardService = new AdminDashboardService();
