import type { Metadata } from"next";
import { Source_Serif_4, Source_Sans_3, Playfair_Display } from"next/font/google";
import"./globals.css";
import Nav from"./components/Nav";
import Footer from"./components/Footer";
import { Analytics } from"@vercel/analytics/react";

const sourceSerif = Source_Serif_4({
 variable:"--font-source-serif",
 subsets: ["latin"],
 weight: ["400","600"],
});

const sourceSans = Source_Sans_3({
 variable:"--font-source-sans",
 subsets: ["latin"],
 weight: ["400","600"],
});

const playfairDisplay = Playfair_Display({
 variable:"--font-playfair",
 subsets: ["latin"],
 weight: ["400","600","700"],
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
 className={`${sourceSerif.variable} ${sourceSans.variable} ${playfairDisplay.variable} h-full antialiased`}
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
