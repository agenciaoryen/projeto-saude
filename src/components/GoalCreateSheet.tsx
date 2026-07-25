"use client";

import { useState } from "react";
import { toast } from "sonner";

const AREAS = [
  { id: "saude", emoji: "💚", label: "Saúde" },
  { id: "carreira", emoji: "💼", label: "Carreira" },
  { id: "financas", emoji: "💰", label: "Finanças" },
  { id: "relacionamentos", emoji: "❤️", label: "Relac." },
  { id: "desenvolvimento", emoji: "🧠", label: "Mente" },
  { id: "familia", emoji: "🏡", label: "Família" },
  { id: "lazer", emoji: "🌊", label: "Lazer" },
  { id: "espiritualidade", emoji: "✨", label: "Espirit." },
];

type Step = 1 | 2 | 3;

export function GoalCreateSheet({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("saude");
  const [why, setWhy] = useState("");
  const [type, setType] = useState<"destino" | "direcao">("direcao");
  const [guardianName, setGuardianName] = useState("");
  const [reward, setReward] = useState("");
  const [punishment, setPunishment] = useState("");
  const [firstStage, setFirstStage] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !firstStage.trim()) return;
    setSaving(true);
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        area, type,
        description: "",
        why_it_matters: why.trim(),
        guardian_name: guardianName.trim() || null,
        reward: reward.trim() || null,
        punishment: punishment.trim() || null,
        first_stage_title: firstStage.trim(),
      }),
    });
    if (res.ok) {
      toast.success("Meta criada!");
      onCreated();
      onClose();
    } else {
      toast.error("Erro ao criar meta");
    }
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420, maxHeight: "85dvh", overflowY: "auto", background: "#151520", borderRadius: 24, padding: 24, border: "1px solid rgba(167,139,250,0.15)" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#e0d6ff" }}>
          {step === 1 ? "Nova meta" : step === 2 ? "Tipo da meta" : "Compromisso"}
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 12, color: "#9e96b5" }}>
          {step === 1 ? "O que você quer conquistar?" : step === 2 ? "Como você prefere definir?" : "Opcional — ajuda a manter o foco"}
        </p>

        {step === 1 && (
          <>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título da meta" autoFocus style={inputS} />
            <p style={{ fontSize: 10, color: "#A78BFA", margin: "12px 0 6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>Área da vida</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {AREAS.map(a => (
                <button key={a.id} type="button" onClick={() => setArea(a.id)}
                  style={{ padding: "10px 4px", borderRadius: 12, border: area === a.id ? "2px solid #7C5CFF" : "1px solid rgba(167,139,250,0.15)", background: area === a.id ? "rgba(124,92,255,0.1)" : "#0B0B10", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontFamily: "inherit" }}>
                  <span style={{ fontSize: 18 }}>{a.emoji}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: area === a.id ? "#A78BFA" : "#9e96b5" }}>{a.label}</span>
                </button>
              ))}
            </div>
            <textarea value={why} onChange={e => setWhy(e.target.value)} placeholder="Por que isso importa?" rows={2} style={{ ...inputS, marginTop: 12, resize: "none", height: 60 }} />
          </>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {([
              { val: "direcao", icon: "🧭", title: "Direção", desc: "Algo que quero cultivar, sem prazo fixo" },
              { val: "destino", icon: "🎯", title: "Destino", desc: "Um resultado concreto com data definida" },
            ] as const).map(opt => (
              <button key={opt.val} type="button" onClick={() => setType(opt.val)}
                style={{ padding: 14, borderRadius: 14, border: type === opt.val ? "2px solid #7C5CFF" : "1px solid rgba(167,139,250,0.15)", background: type === opt.val ? "rgba(124,92,255,0.08)" : "#0B0B10", cursor: "pointer", textAlign: "left", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>{opt.icon}</span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e0d6ff" }}>{opt.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9e96b5" }}>{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <>
            <input value={firstStage} onChange={e => setFirstStage(e.target.value)} placeholder="Primeira etapa concreta" autoFocus style={inputS} />
            <p style={{ fontSize: 10, color: "#9e96b5", margin: "14px 0 10px" }}>Opcional — te ajuda a manter o compromisso</p>
            <input value={guardianName} onChange={e => setGuardianName(e.target.value)} placeholder="Nome do guardião (alguém que te cobra)" style={{ ...inputS, marginBottom: 8 }} />
            <input value={reward} onChange={e => setReward(e.target.value)} placeholder="Recompensa ao concluir" style={{ ...inputS, marginBottom: 8 }} />
            <input value={punishment} onChange={e => setPunishment(e.target.value)} placeholder="Punição se não fizer" style={inputS} />
          </>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button type="button" onClick={step === 1 ? onClose : () => setStep((step - 1) as Step)}
            style={{ flex: 1, padding: 14, borderRadius: 14, border: "1px solid rgba(167,139,250,0.2)", background: "transparent", color: "#9e96b5", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            {step === 1 ? "Cancelar" : "Voltar"}
          </button>
          <button type="button" onClick={step < 3 ? () => setStep((step + 1) as Step) : save} disabled={saving}
            style={{ flex: 2, padding: 14, borderRadius: 14, border: 0, background: "#7C5CFF", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}>
            {step === 3 ? (saving ? "Criando..." : "Criar meta") : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputS: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px",
  borderRadius: 12, border: "1px solid rgba(167,139,250,0.2)",
  background: "#0B0B10", color: "#e0d6ff", fontSize: 14,
  fontFamily: "inherit", outline: "none",
};
