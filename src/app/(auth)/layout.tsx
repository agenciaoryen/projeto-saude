import { HeaderWrapper, MainWrapper, BottomNavWrapper } from "@/components/DashboardChrome";
import { SleepCapture } from "@/components/SleepCapture";
import { ServiceWorkerNavListener } from "@/components/ServiceWorkerNavListener";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ServiceWorkerNavListener />
      <SleepCapture />
      <HeaderWrapper />
      <MainWrapper>{children}</MainWrapper>
      <BottomNavWrapper />
    </div>
  );
}
