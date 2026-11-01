import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/AppLayout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Asset Management System",
  description: "Inventory, stock control, and asset tracking with Model 19, 20, and 22 vouchers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-slate-50 font-sans text-slate-900`}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
