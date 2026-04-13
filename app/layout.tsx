import type { Metadata } from"next";
import { Playfair_Display, DM_Sans } from"next/font/google";
import"./globals.css";
import Nav from"./components/Nav";
import Footer from"./components/Footer";
import { Analytics } from"@vercel/analytics/react";

const playfairDisplay = Playfair_Display({
 variable:"--font-playfair",
 subsets: ["latin"],
 weight: ["400","500","600","700"],
});

const dmSans = DM_Sans({
 variable:"--font-dm-sans",
 subsets: ["latin"],
 weight: ["400","500","600"],
});

export const metadata: Metadata = {
 title: {
 default:"Women's Health Evidence Lab",
 template:"%s | Women's Health Evidence Lab",
 },
 description:
"Surfacing overlooked drug signals for women's health.",
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html
 lang="en"
 className={`${playfairDisplay.variable} ${dmSans.variable} h-full antialiased`}
 >
 <body className="min-h-full flex flex-col" style={{ backgroundColor:"#F5F3EF" }}>
 <Nav />
 <div className="flex-1 flex flex-col">{children}</div>
 <Footer />
 <Analytics />
 </body>
 </html>
 );
}
