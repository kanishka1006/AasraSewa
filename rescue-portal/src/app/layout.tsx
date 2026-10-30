import type { Metadata } from "next";
import "./globals.css";
import Notifications from "@/components/Notifications";


export const metadata: Metadata = {
  title: "AasraSewa Platform",
  description: "Disaster Relief Coordination",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Notifications />
        {children}
      </body>
    </html>
  );
}
