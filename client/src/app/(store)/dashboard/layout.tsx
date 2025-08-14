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
        <main className="relative lg:pl-64 w-full min-h-screen [view-transition-name:layout]">
          <div className="px-2 sm:px-4 md:px-8 lg:px-16">{children}</div>
        </main>
      </WorkflowUpdatesProvider>
    </PageTransition>
  );
}
