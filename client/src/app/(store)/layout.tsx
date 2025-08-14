// client/src/app/(store)/layout.tsx
import { Metadata } from "next";
import "../globals.css";
import { ThemeProvider } from "./themeProvider";
import Header from "@/components/header/Header";

export const metadata: Metadata = {
  title: "DevOptics",
  description: "A DevOps dashboard for monitoring CI/CD pipelines",
  icons: {
    icon: "/logoWhite.png",
  },
};

interface LayoutProps {
  children: React.ReactNode;
}
export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          <main className="pt-header min-h-screen">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
