export interface MoodChip {
  id: string;
  label: string;   // masculino / neutro
  labelF: string;  // feminino
  emoji: string;
  valence: "positive" | "negative";
}

export const MOOD_CHIPS: MoodChip[] = [
  { id: "bem",           label: "Bem",            labelF: "Bem",            emoji: "😊", valence: "positive" },
  { id: "tranquila",     label: "Tranquilo",      labelF: "Tranquila",      emoji: "😌", valence: "positive" },
  { id: "animada",       label: "Animado",         labelF: "Animada",        emoji: "✨", valence: "positive" },
  { id: "grata",         label: "Grato",           labelF: "Grata",          emoji: "🙏", valence: "positive" },
  { id: "esperancosa",   label: "Esperançoso",     labelF: "Esperançosa",    emoji: "🌱", valence: "positive" },
  { id: "cansada",       label: "Cansado",         labelF: "Cansada",        emoji: "😴", valence: "negative" },
  { id: "ansiosa",       label: "Ansioso",         labelF: "Ansiosa",        emoji: "😰", valence: "negative" },
  { id: "triste",        label: "Triste",          labelF: "Triste",         emoji: "😢", valence: "negative" },
  { id: "irritada",      label: "Irritado",        labelF: "Irritada",       emoji: "😤", valence: "negative" },
  { id: "sobrecarregada",label: "Sobrecarregado",  labelF: "Sobrecarregada", emoji: "🌊", valence: "negative" },
];

export function getMoodLabel(chip: MoodChip, gender: string): string {
  return gender === "feminino" ? chip.labelF : chip.label;
}

export function getMoodById(id: string): MoodChip | undefined {
  return MOOD_CHIPS.find((m) => m.id === id);
}
