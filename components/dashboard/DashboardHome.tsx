import Stats from "./Stats";
import Releases from "./Releases";
import AIReviewCard from "./AIReviewCard";

export default function DashboardHome() {
  return (
    <div className="space-y-8">

      <Stats />

      <div className="grid gap-8 xl:grid-cols-3">

        <div className="xl:col-span-2">
          <Releases />
        </div>

        <AIReviewCard />

      </div>

    </div>
  );
}