"use client";

import { useEffect, useState } from "react";
import { t, type Lang } from "@/lib/i18n";

export function useTranslation() {
  const [lang, setLang] = useState<Lang>("pt");

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (data.context?.language) {
          setLang(data.context.language as Lang);
        }
      })
      .catch(() => {});
  }, []);

  const translate = (key: string, vars?: Record<string, string>) =>
    t(lang, key, vars);

  return { lang, setLang, t: translate };
}
