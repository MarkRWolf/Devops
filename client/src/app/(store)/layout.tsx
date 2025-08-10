import { WorkflowUpdatesProvider } from "@/components/github/realtime";
import "../globals.css";
import { ThemeProvider } from "./themeProvider";
import Header from "@/components/header/Header";

interface LayoutProps {
  children: React.ReactNode;
}
export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          <WorkflowUpdatesProvider>
            <main className="pt-header min-h-screen">{children}</main>
          </WorkflowUpdatesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
