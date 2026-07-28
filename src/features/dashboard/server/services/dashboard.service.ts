import "server-only";

import { dashboardRepository } from "@/features/dashboard/server/repositories/dashboard.repository";

export class DashboardService {
  async getDashboard(organizationId: string) {
    return dashboardRepository.getOverview(organizationId);
  }
}

export const dashboardService = new DashboardService();
