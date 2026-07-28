"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "@/lib/useTranslation";
import { compressImage, uploadToCloud, photoUrl } from "@/lib/photo-storage";
import { ChevronLeft, ChevronDown, Plus, X, ArrowRight, Camera, Mic, Video, FileText } from "lucide-react";

const MOODS = [1, 2, 3, 4, 5] as const;
const MOOD_EMOJI: Record<number, string> = { 1: "😔", 2: "😕", 3: "😐", 4: "🙂", 5: "😊" };

/** Get today's date in the user's actual browser timezone (not hardcoded offset) */
function getBrowserDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatLongDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const wk = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const day = d.getDate();
  const month = d.toLocaleDateString("pt-BR", { month: "long" });
  return `${wk.charAt(0).toUpperCase() + wk.slice(1)}, ${day} de ${month}`;
}

export default function NovoDiarioPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [entryDate, setEntryDate] = useState(() => getBrowserDate());
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [moodOpen, setMoodOpen] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [audios, setAudios] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [pdfs, setPdfs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const selectedMoodEmoji = mood ? MOOD_EMOJI[mood] : "😶";

  const wordCount = useMemo(() => {
    const text = content.trim();
    return text ? text.split(/\s+/).length : 0;
  }, [content]);

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    if ("showPicker" in el && typeof el.showPicker === "function") {
      el.showPicker();
    } else {
      el.click();
    }
  };

  const handleSave = async () => {
    if (!content.trim()) { toast.error(t("escreva_algo")); return; }
    setSaving(true);
    const res = await fetch("/api/diary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: entryDate, title: title.trim(), content: content.trim(), mood, photos: [...photos, ...audios, ...videos, ...pdfs] }),
    });
    if (!res.ok) { toast.error(t("erro_salvar_entrada")); setSaving(false); return; }
    toast.success(t("entrada_salva"));
    router.push("/diario");
    router.refresh();
  };

  const handlePhotoAdd = useCallback(async (file: File) => {
    try {
      const compressed = await compressImage(file);
      const path = await uploadToCloud(compressed, "diary");
      setPhotos((prev) => [...prev, path]);
    } catch { toast.error("Erro ao processar imagem"); }
  }, []);

  const handleAudioAdd = useCallback(async (file: File) => {
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const path = await uploadToCloud(base64, "diary");
      setAudios((prev) => [...prev, path]);
    } catch { toast.error("Erro ao processar áudio"); }
  }, []);

  const removePhoto = useCallback((path: string) => {
    setPhotos((prev) => prev.filter((p) => p !== path));
  }, []);

  const removeAudio = useCallback((path: string) => {
    setAudios((prev) => prev.filter((a) => a !== path));
  }, []);

  const isAudioFile = (path: string) => /\.(mp3|m4a|wav|ogg|webm|aac|flac)$/i.test(path);

  const handleVideoAdd = useCallback(async (file: File) => {
    // Check duration for videos (max 10 min)
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(file);
    await new Promise<void>((resolve) => { video.onloadedmetadata = () => resolve(); });
    if (video.duration > 600) {
      toast.error("Vídeo muito longo. Máximo: 10 minutos.");
      URL.revokeObjectURL(video.src);
      return;
    }
    URL.revokeObjectURL(video.src);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const path = await uploadToCloud(base64, "diary");
      setVideos((prev) => [...prev, path]);
    } catch { toast.error("Erro ao processar vídeo"); }
  }, []);

  const handlePdfAdd = useCallback(async (file: File) => {
    if (pdfs.length >= 3) { toast.error("Máximo 3 PDFs por entrada"); return; }
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const path = await uploadToCloud(base64, "diary");
      setPdfs((prev) => [...prev, path]);
    } catch { toast.error("Erro ao processar PDF"); }
  }, [pdfs.length]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4" });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current);
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        const path = await uploadToCloud(base64, "diary");
        setAudios((prev) => [...prev, path]);
      };
      recorder.start();
      setRecording(true);
    } catch {
      // Fall back to file upload
      audioInputRef.current?.click();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#0F0F14", paddingBottom: 100 }}>
      {/* Floating back */}
      <button type="button" onClick={() => router.back()}
        style={{
          position: "absolute", top: 16, left: 16, zIndex: 10,
          width: 36, height: 36, borderRadius: "50%",
          background: "#1a1530", border: "1px solid rgba(167,139,250,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#A78BFA", backdropFilter: "blur(8px)",
        }}>
        <ChevronLeft size={18} />
      </button>

      {/* Floating mood picker */}
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}>
        <button type="button" onClick={() => setMoodOpen(!moodOpen)}
          style={{
            height: 36, paddingInline: 14, borderRadius: 9999,
            background: "#1a1530", border: "1px solid rgba(167,139,250,0.2)",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            color: "#e0d6ff", backdropFilter: "blur(8px)",
          }}>
          <span style={{ fontSize: 18 }}>{selectedMoodEmoji}</span>
          <ChevronDown size={12} style={{ color: "#9e96b5", transform: moodOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
        </button>
        {moodOpen && (
          <div style={{
            position: "absolute", top: 44, right: 0, borderRadius: 16, padding: "6px 4px",
            display: "flex", gap: 2, background: "#1a1530",
            border: "1px solid rgba(167,139,250,0.25)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}>
            {MOODS.map((m) => (
              <button key={m} type="button" onClick={() => { setMood(m); setMoodOpen(false); }}
                style={{
                  width: 40, height: 40, borderRadius: "50%", border: 0, cursor: "pointer",
                  fontSize: 20, background: mood === m ? "rgba(124,92,255,0.2)" : "transparent",
                }}>
                {MOOD_EMOJI[m]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date header */}
      <div style={{ padding: "72px 24px 8px", position: "relative" }}>
        <button type="button" onClick={openDatePicker}
          style={{
            background: "none", border: 0, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: "inherit", padding: 0,
          }}>
          <span style={{
            fontSize: 11, fontFamily: "monospace", color: "#9e96b5",
            letterSpacing: ".06em", textTransform: "uppercase",
          }}>
            {formatLongDate(entryDate)}
          </span>
          <ChevronDown size={12} style={{ color: "#9e96b5" }} />
        </button>
        <input type="date" ref={dateInputRef} value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          style={{
            position: "absolute", top: 72, left: 24, opacity: 0,
            width: 180, height: 24, cursor: "pointer",
          }} />
      </div>

      {/* Title */}
      <div style={{ padding: "0 24px 12px" }}>
        <div
          contentEditable suppressContentEditableWarning role="textbox" aria-label="Título"
          data-placeholder="Título (opcional)"
          onInput={(e) => setTitle((e.target as HTMLElement).innerText)}
          onPaste={handlePaste}
          style={{
            outline: "none", fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em",
            lineHeight: 1.15, minHeight: "1.15em", color: "#e0d6ff",
          }}
        />
      </div>

      {/* Content */}
      <div style={{ padding: "0 24px" }}>
        <div
          contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true"
          aria-label="Conteúdo do diário" data-placeholder="Escreva o que estiver passando..."
          onInput={(e) => setContent((e.target as HTMLElement).innerText)}
          onPaste={handlePaste}
          style={{
            outline: "none", fontSize: 15, lineHeight: 1.7, letterSpacing: "-0.005em",
            minHeight: "40vh", color: "#e0d6ff",
          }}
        />
      </div>

      {/* Media strip (photos + audio) */}
      <div style={{ padding: "20px 24px 0" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Photos */}
          {photos.map((p) => (
            <div key={p} style={{
              width: 72, height: 72, borderRadius: 14, overflow: "hidden",
              border: "2px solid rgba(167,139,250,0.3)", flexShrink: 0, position: "relative",
            }}>
              <img src={photoUrl(p)!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button type="button" onClick={() => removePhoto(p)}
                style={{
                  position: "absolute", top: 4, right: 4, width: 22, height: 22,
                  borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: 0,
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}>
                <X size={12} />
              </button>
            </div>
          ))}
          {/* Audio clips */}
          {audios.map((a) => (
            <div key={a} style={{
              height: 44, borderRadius: 12, overflow: "hidden",
              border: "1.5px solid rgba(167,139,250,0.25)",
              background: "rgba(124,92,255,0.06)",
              flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
              padding: "0 8px 0 4px", position: "relative",
            }}>
              <audio src={photoUrl(a)!} controls style={{ height: 28, width: 160 }} />
              <button type="button" onClick={() => removeAudio(a)}
                style={{
                  width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.5)",
                  border: 0, color: "#fff", display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer", flexShrink: 0,
                }}>
                <X size={10} />
              </button>
            </div>
          ))}
          {/* Video */}
          {videos.map((v) => (
            <div key={v} style={{ position: "relative", flexShrink: 0 }}>
              <video src={photoUrl(v)!} controls style={{ height: 100, borderRadius: 12, maxWidth: 200 }} />
              <button type="button" onClick={() => setVideos(prev => prev.filter(p => p !== v))}
                style={{
                  position: "absolute", top: 4, right: 4, width: 22, height: 22,
                  borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: 0,
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}>
                <X size={12} />
              </button>
            </div>
          ))}
          {/* PDFs */}
          {pdfs.map((p) => (
            <div key={p} style={{
              height: 40, borderRadius: 10, overflow: "hidden",
              border: "1.5px solid rgba(167,139,250,0.2)",
              background: "rgba(124,92,255,0.04)",
              flexShrink: 0, display: "flex", alignItems: "center", gap: 8,
              padding: "0 10px", position: "relative",
            }}>
              <FileText size={14} style={{ color: "#A78BFA", flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: "#9e96b5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>
                PDF
              </span>
              <button type="button" onClick={() => setPdfs(prev => prev.filter(pdf => pdf !== p))}
                style={{
                  width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.5)",
                  border: 0, color: "#fff", display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer", flexShrink: 0,
                }}>
                <X size={10} />
              </button>
            </div>
          ))}
          {/* Photo button */}
          <button type="button" onClick={() => photoInputRef.current?.click()}
            style={{
              width: 72, height: 72, borderRadius: 14,
              border: "1.5px dashed rgba(167,139,250,0.3)",
              background: "rgba(124,92,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#A78BFA",
            }}>
            <Camera size={20} />
          </button>
          {/* Audio button — tap to upload, hold to record */}
          <button type="button"
            onClick={() => audioInputRef.current?.click()}
            onMouseDown={() => startRecording()}
            onMouseUp={() => stopRecording()}
            onMouseLeave={() => recording && stopRecording()}
            onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
            style={{
              width: recording ? 88 : 72, height: recording ? 88 : 72, borderRadius: 14,
              border: recording ? "2px solid #FF4D4D" : "1.5px dashed rgba(167,139,250,0.3)",
              background: recording ? "rgba(255,77,77,0.15)" : "rgba(124,92,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: recording ? "#FF4D4D" : "#A78BFA",
              transition: "all .15s ease", flexDirection: "column", gap: 2,
              userSelect: "none",
            }}>
            {recording ? (
              <>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF4D4D", animation: "pulse 1s infinite" }} />
                <span style={{ fontSize: 8, color: "#FF4D4D", fontWeight: 600 }}>Gravando</span>
                <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
              </>
            ) : (
              <>
                <Mic size={20} />
                <span style={{ fontSize: 9, color: "#9e96b5" }}>Áudio</span>
              </>
            )}
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { if (e.target.files?.[0]) handlePhotoAdd(e.target.files[0]); e.target.value = ""; }} />
          <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: "none" }}
            onChange={(e) => { if (e.target.files?.[0]) handleAudioAdd(e.target.files[0]); e.target.value = ""; }} />
          {/* Video button */}
          <button type="button" onClick={() => videoInputRef.current?.click()}
            style={{
              width: 72, height: 72, borderRadius: 14,
              border: "1.5px dashed rgba(167,139,250,0.3)",
              background: "rgba(124,92,255,0.06)", display: "flex",
              alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#A78BFA", flexDirection: "column", gap: 2,
            }}>
            <Video size={20} />
            <span style={{ fontSize: 9, color: "#9e96b5" }}>Vídeo</span>
          </button>
          <input ref={videoInputRef} type="file" accept="video/*" style={{ display: "none" }}
            onChange={(e) => { if (e.target.files?.[0]) handleVideoAdd(e.target.files[0]); e.target.value = ""; }} />
          {/* PDF button */}
          <button type="button" onClick={() => pdfInputRef.current?.click()}
            style={{
              width: 72, height: 72, borderRadius: 14,
              border: "1.5px dashed rgba(167,139,250,0.3)",
              background: "rgba(124,92,255,0.06)", display: "flex",
              alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#A78BFA", flexDirection: "column", gap: 2,
            }}>
            <FileText size={20} />
            <span style={{ fontSize: 9, color: "#9e96b5" }}>PDF</span>
          </button>
          <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" style={{ display: "none" }}
            onChange={(e) => { if (e.target.files?.[0]) handlePdfAdd(e.target.files[0]); e.target.value = ""; }} />
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60,
        padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#0F0F14", borderTop: "1px solid rgba(167,139,250,0.1)",
      }}>
        <span style={{ fontSize: 11, color: "#9e96b5", fontFamily: "monospace" }}>
          {wordCount > 0 ? `${wordCount} ${wordCount === 1 ? "palavra" : "palavras"}` : "Comece a escrever"}
        </span>
        <Button onClick={handleSave} disabled={saving || !content.trim()}
          style={{
            height: 40, paddingInline: 20, borderRadius: 12,
            background: "#7C5CFF", border: 0, color: "#fff",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            opacity: (saving || !content.trim()) ? 0.5 : 1,
          }}>
          {saving ? "Salvando…" : "Concluir"}
        </Button>
      </div>
    </div>
  );
}
