"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function loadCache() {
  try {
    const raw = localStorage.getItem("user_profile");
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return null;
}

function saveCache(data: { name?: string; avatar_url?: string }) {
  try {
    localStorage.setItem("user_profile", JSON.stringify(data));
  } catch { /* noop */ }
}

export function UserAvatar() {
  const [profile, setProfile] = useState<{ name: string; avatar_url: string }>(
    () => loadCache() || { name: "", avatar_url: "" }
  );

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        const next = {
          name: data.name || "",
          avatar_url: data.avatar_url || "",
        };
        setProfile(next);
        saveCache(next);
      })
      .catch(() => {});
  }, []);

  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : "EU";

  return (
    <Avatar className="h-8 w-8 cursor-pointer">
      <AvatarImage src={profile.avatar_url} alt="Foto de perfil" />
      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
