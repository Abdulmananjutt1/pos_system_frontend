import Sidebar from "@/components/layout/Sidebar";
import ThemeProvider from "@/components/layout/ThemeProvider";
import { Toaster } from "react-hot-toast";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <ThemeProvider />
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
      <Toaster position="top-right" />
    </div>
  );
}
