import DashboardNav from "@/components/dashboardNav/DashboardNav";
import PageTransition from "../pageTransition";
import { ThemeProvider } from "../themeProvider";

interface LayoutProps {
  children: React.ReactNode;
}
export default function RootLayout({ children }: LayoutProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <PageTransition>
        <DashboardNav />
        <main className="pl-[256px] w-full min-h-screen [view-transition-name:layout]">
          {children}
        </main>
      </PageTransition>
    </ThemeProvider>
  );
}
