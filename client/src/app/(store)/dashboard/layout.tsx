// client/src/app/(store)/dashboard/layout.tsx
import DashboardNav from "@/components/dashboardNav/DashboardNav";
import PageTransition from "../pageTransition";
import { WorkflowUpdatesProvider } from "@/components/github/realtime";

interface LayoutProps {
  children: React.ReactNode;
}
export default function RootLayout({ children }: LayoutProps) {
  return (
    <PageTransition>
      <WorkflowUpdatesProvider>
        <DashboardNav />
        <main className="relative pl-64 w-full min-h-screen [view-transition-name:layout]">
          <div className="px-16">{children}</div>
        </main>
      </WorkflowUpdatesProvider>
    </PageTransition>
  );
}
