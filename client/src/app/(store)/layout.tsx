import "../globals.css";
import PageTransition from "./pageTransition";
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
          <PageTransition>
            <main className="min-h-screen [view-transition-name:page]">{children}</main>
          </PageTransition>
        </ThemeProvider>
      </body>
    </html>
  );
}
