"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Até logo! 🌱");
    router.push("/");
    router.refresh();
  };

  return (
    <button onClick={handleLogout} className="w-full text-left px-2 py-1.5 text-sm">
      Sair
    </button>
  );
}
