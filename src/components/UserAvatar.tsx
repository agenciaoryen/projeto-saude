"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserAvatar() {
  const [avatarUrl, setAvatarUrl] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
        if (data.name) setName(data.name);
      })
      .catch(() => {});
  }, []);

  return (
    <Avatar className="h-8 w-8 cursor-pointer">
      <AvatarImage src={avatarUrl} alt="Foto de perfil" />
      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
        {name ? name.charAt(0).toUpperCase() : "EU"}
      </AvatarFallback>
    </Avatar>
  );
}
