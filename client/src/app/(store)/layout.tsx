import "../globals.css";
import PageTransition from "./pageTransition";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PageTransition>
          <main className="min-h-screen [view-transition-name:page]">{children}</main>
        </PageTransition>
      </body>
    </html>
  );
}
