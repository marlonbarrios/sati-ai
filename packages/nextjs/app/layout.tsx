import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sati-Ai",
  description: "A guide to the Pāli world of the Theravada tradition",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Sati-Ai",
    description: "A guide to the Pāli world of the Theravada tradition",
    images: ["/thumbnail.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body data-theme="sati" className="bg-base-200 text-base-content" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var stored=localStorage.getItem("sati-theme");var dark=stored==="dark"||(stored!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var theme=dark?"satiDark":"sati";document.documentElement.setAttribute("data-theme",theme);document.body.setAttribute("data-theme",theme);document.documentElement.style.colorScheme=dark?"dark":"light";}catch(e){}})();`,
          }}
        />
        <ThemeProvider>
          <div className="flex min-h-screen flex-col bg-base-200 text-base-content">
            <Header />
            <main className="relative flex flex-1 flex-col">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
