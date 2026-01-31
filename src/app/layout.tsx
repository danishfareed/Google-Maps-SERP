import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "GMB Serp Tracker",
    description: "Local SEO Grid Rank Tracker",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
