import { HeaderWrapper, MainWrapper, BottomNavWrapper } from "@/components/DashboardChrome";
import { SleepCapture } from "@/components/SleepCapture";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-full">
      <SleepCapture />
      <HeaderWrapper />
      <MainWrapper>{children}</MainWrapper>
      <BottomNavWrapper />
    </div>
  );
}
