import type { Metadata } from "next";

import "./globals.css";


export const metadata: Metadata = {
  title: "Tylers.WTF",
  description: "Model Playground Supreme",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased w-full h-full`}
      >
        {children}
      </body>
    </html>
  );
}
