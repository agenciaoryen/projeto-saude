import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { base64, folder } = await request.json();

    if (!base64 || !folder) {
      return NextResponse.json({ error: "base64 e folder obrigatórios" }, { status: 400 });
    }

    if (!["meals", "diary", "avatars"].includes(folder)) {
      return NextResponse.json({ error: "folder inválido" }, { status: 400 });
    }

    // Decode base64 (with or without data URI prefix)
    const matches = base64.match(/^data:([^;]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext: string;
    let mimeType: string;
    if (matches) {
      mimeType = matches[1];
      // Map MIME type to extension
      if (mimeType.startsWith("image/")) {
        ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
      } else if (mimeType.startsWith("audio/")) {
        ext = mimeType.includes("webm") ? "weba" : mimeType.includes("mp4") || mimeType.includes("m4a") ? "m4a" : "ogg";
      } else if (mimeType.startsWith("video/")) {
        ext = "mp4";
      } else if (mimeType.includes("pdf") || mimeType === "application/pdf") {
        ext = "pdf";
        mimeType = "application/pdf";
      } else {
        ext = "jpg";
      }
      buffer = Buffer.from(matches[2], "base64");
    } else {
      ext = "jpg";
      mimeType = "image/jpeg";
      buffer = Buffer.from(base64, "base64");
    }

    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${folder}/${user.id}/${fileName}`;

    const admin = getSupabaseAdmin();
    const { error: uploadError } = await admin.storage
      .from("user-content")
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 });
    }

    return NextResponse.json({ path });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload", detail: String(error) },
      { status: 500 }
    );
  }
}
