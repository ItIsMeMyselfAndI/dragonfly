import { BomProvider } from "@/features/bom/store";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "reactflow/dist/style.css";
import { MobileShell } from "@/components/MobileShell";
import { SheetProvider } from "@/lib/sheet-context";
import { Toaster } from "@/components/ui/sonner";
import { InspireProvider } from "@/features/inspire/store";
import { FlowProvider } from "@/features/visual-flow/store";
import { CartProvider } from "@/features/cart/store";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/features/auth/store";
import { SettingsProvider } from "@/features/settings/store";
import { NavigationGuardProvider } from "@/components/navigation/NavigationGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dragonfly",
  description: "Turn messy ideas into a ready-to-buy reality.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <SettingsProvider>
              <BomProvider>
                <InspireProvider>
                  <FlowProvider>
                    <CartProvider>
                      <SheetProvider>
                        <NavigationGuardProvider>
                          <MobileShell>{children}</MobileShell>
                          <Toaster position="top-center" theme="dark" />
                        </NavigationGuardProvider>
                      </SheetProvider>
                    </CartProvider>
                  </FlowProvider>
                </InspireProvider>
              </BomProvider>
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
