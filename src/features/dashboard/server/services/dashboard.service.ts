import "server-only";

import { dashboardRepository } from "@/features/dashboard/server/repositories/dashboard.repository";

export class DashboardService {
  async getDashboard(
    organizationId: string,
    scope: { artistIds?: string[] | null; userId?: string } = {},
  ) {
    return dashboardRepository.getOverview(organizationId, scope);
  }
}

export const dashboardService = new DashboardService();
