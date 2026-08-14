import { Sidebar } from "@/components/liftiq/sidebar";
import { MobileNavigation } from "@/components/liftiq/mobile-nav";
import { TopBar } from "@/components/liftiq/topbar";
import { PageFrame } from "@/components/liftiq/page-frame";

export default function LiftIQAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <div className="min-[960px]:pl-[240px]">
        <TopBar />
        <main className="mx-auto w-full max-w-[1400px] px-5 pb-28 pt-6 md:px-8 md:pt-8 min-[960px]:pb-12">
          <PageFrame>{children}</PageFrame>
        </main>
      </div>
      <MobileNavigation />
    </>
  );
}
