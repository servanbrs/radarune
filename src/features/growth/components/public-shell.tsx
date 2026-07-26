import type { ReactNode } from "react";

export function PublicGrowthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dff7ec,transparent_34%),linear-gradient(135deg,#fffaf0,#eef5ff)] px-5 py-10 text-foreground">
      <div className="mx-auto w-full max-w-4xl">{children}</div>
    </main>
  );
}
