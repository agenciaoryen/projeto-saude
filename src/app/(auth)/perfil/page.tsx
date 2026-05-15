"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useTranslation } from "@/lib/useTranslation";
import { LANG_OPTIONS } from "@/lib/i18n";
import { Settings, Plus, X, Camera, Heart } from "lucide-react";
import { compressImage, uploadToCloud, photoUrl } from "@/lib/photo-storage";

interface Porque {
  id: string;
  text: string;
  photoPath: string | null;
}

const GENDER_OPTIONS = [
  { id: "masculino", label: "Masculino", emoji: "⚡" },
  { id: "feminino", label: "Feminino", emoji: "🌸" },
  { id: "nao_dizer", label: "Prefiro não dizer", emoji: "🌱" },
] as const;

export default function PerfilPage() {
  const { t, setLang } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [gender, setGender] = useState("nao_dizer");
  const [language, setLanguage] = useState("pt");
  const [uploading, setUploading] = useState(false);
  const [porques, setPorques] = useState<Porque[]>([]);
  const [savingPorques, setSavingPorques] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const isFirstRender = useRef(true);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setName(data.name || "");
        setEmail(data.email || "");
        setAvatarUrl(data.avatar_url || "");
        setGender(data.gender || "nao_dizer");
        setLanguage(data.language || "pt");
        setPorques(data.porques || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Auto-save name, gender, language
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaved(false);
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, gender, language }),
        });
        if (res.ok) {
          setSaved(true);
          setLang(language as "pt" | "es" | "en");
          try {
            const prev = JSON.parse(localStorage.getItem("user_profile") || "{}");
            localStorage.setItem("user_profile", JSON.stringify({ ...prev, name }));
          } catch { /* noop */ }
        }
      } catch {
        // silent
      }
    }, 1000);
    return () => clearTimeout(autoSaveRef.current);
  }, [name, gender, language]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A foto deve ter no máximo 2MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const finalUrl = data.avatar_url + "?t=" + Date.now();
      setAvatarUrl(finalUrl);
      try {
        const prev = JSON.parse(localStorage.getItem("user_profile") || "{}");
        localStorage.setItem("user_profile", JSON.stringify({ ...prev, avatar_url: finalUrl }));
      } catch { /* noop */ }
      toast.success("Foto atualizada!");
    } catch {
      toast.error("Erro ao enviar foto");
    }
    setUploading(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos de senha");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao alterar senha");
      } else {
        toast.success("Senha alterada com sucesso!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.error("Erro ao alterar senha");
    }
    setChangingPassword(false);
  };

  const savePorques = async (updated: Porque[]) => {
    setPorques(updated);
    setSavingPorques(true);
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ porques: updated }),
      });
    } catch { /* silent */ }
    setSavingPorques(false);
  };

  const addPorque = () => {
    const id = Math.random().toString(36).slice(2);
    savePorques([...porques, { id, text: "", photoPath: null }]);
  };

  const updatePorque = (id: string, data: Partial<Omit<Porque, "id">>) => {
    savePorques(porques.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const removePorque = (id: string) => {
    savePorques(porques.filter((p) => p.id !== id));
  };

  const handlePorquePhoto = async (id: string, file: File) => {
    try {
      const compressed = await compressImage(file);
      const path = await uploadToCloud(compressed, "meals");
      updatePorque(id, { photoPath: path });
    } catch {
      toast.error("Erro ao processar imagem");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{t("carregando")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground text-sm">Suas informações pessoais</p>
        </div>
        {saved && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
            Salvo ✓
          </span>
        )}
      </div>

      {/* Photo + Name + Email */}
      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <AvatarImage src={avatarUrl} alt="Foto de perfil" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {name ? name.charAt(0).toUpperCase() : "EU"}
                </AvatarFallback>
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                  <span className="text-xs">...</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Clique na foto para trocar
            </p>

            <div className="w-full space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="rounded-xl opacity-60"
                />
                <p className="text-[10px] text-muted-foreground">
                  O email não pode ser alterado
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gender */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("pergunta_genero")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setGender(opt.id)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  gender === opt.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Idioma / Language</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLanguage(opt.id)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  language === opt.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {opt.flag} {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meus Porquês */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="size-4 text-primary" /> Meus Porquês
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              O que te move? Pessoas, valores, crenças...
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg gap-1"
            onClick={addPorque}
            disabled={porques.length >= 5}
          >
            <Plus className="size-3.5" />
            Novo
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {porques.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum porquê cadastrado.<br />
              <span className="text-xs">Adicione o que te motiva a seguir.</span>
            </p>
          ) : (
            porques.map((pq) => (
              <PorqueEditor
                key={pq.id}
                porque={pq}
                onUpdate={(data) => updatePorque(pq.id, data)}
                onRemove={() => removePorque(pq.id)}
                onPhoto={(file) => handlePorquePhoto(pq.id, file)}
              />
            ))
          )}
          <p className="text-[10px] text-muted-foreground text-right">
            {savingPorques ? "Salvando..." : porques.length > 0 ? "Salvo ✓" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Alterar senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Senha atual</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Nova senha</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <Button
            className="w-full rounded-xl"
            onClick={handleChangePassword}
            disabled={changingPassword}
          >
            {changingPassword ? "Alterando..." : "Alterar senha"}
          </Button>
        </CardContent>
      </Card>

      {/* Link to configurações */}
      <Link
        href="/configurações"
        className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Settings className="size-4" />
        {t("config_title")}
      </Link>
    </div>
  );
}

/** Inline editor for a single "porquê" — photo thumbnail + text + remove. */
function PorqueEditor({
  porque,
  onUpdate,
  onRemove,
  onPhoto,
}: {
  porque: Porque;
  onUpdate: (data: Partial<Omit<Porque, "id">>) => void;
  onRemove: () => void;
  onPhoto: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const photoSrc = porque.photoPath ? photoUrl(porque.photoPath) : null;

  return (
    <div className="flex gap-3 p-3 rounded-xl bg-muted/50">
      {/* Photo */}
      <button
        type="button"
        className="size-14 rounded-xl overflow-hidden shrink-0 bg-muted flex items-center justify-center hover:opacity-80 transition-opacity"
        onClick={() => fileRef.current?.click()}
      >
        {photoSrc ? (
          <img src={photoSrc} alt="" className="size-full object-cover" />
        ) : (
          <Camera className="size-4 text-muted-foreground" />
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) onPhoto(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </button>

      {/* Text + remove */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <textarea
          value={porque.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Ex: Minha filha, minha fé, quero estar saudável..."
          rows={2}
          className="w-full resize-none bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50"
        />
        <button
          type="button"
          onClick={onRemove}
          className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
        >
          Remover
        </button>
      </div>
    </div>
  );
}
