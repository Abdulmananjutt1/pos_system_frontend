import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PharmaPOS - Pharmacy Management System",
  description: "Point of Sale system for pharmacy management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
