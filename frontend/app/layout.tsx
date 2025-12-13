import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bhishak Med - Doctor Teleconsultation",
  description: "Professional telemedicine platform for doctors and patients",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
