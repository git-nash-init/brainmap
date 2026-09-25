import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/Toaster";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <AnnouncementBar />
      <Navbar />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
      <Toaster />
    </>
  );
}
