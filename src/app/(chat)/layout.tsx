import { BottomNav } from "@/components/BottomNav";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-[100dvh]">
      <div className="flex-1 min-h-0">{children}</div>
      <BottomNav />
    </div>
  );
}
