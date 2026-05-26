export interface MoodChip {
  id: string;
  label: string;
  emoji: string;
  valence: "positive" | "negative";
}

export const MOOD_CHIPS: MoodChip[] = [
  { id: "bem",           label: "Bem",          emoji: "😊", valence: "positive" },
  { id: "tranquila",     label: "Tranquila",     emoji: "😌", valence: "positive" },
  { id: "animada",       label: "Animada",       emoji: "✨", valence: "positive" },
  { id: "grata",         label: "Grata",         emoji: "🙏", valence: "positive" },
  { id: "esperancosa",   label: "Esperançosa",   emoji: "🌱", valence: "positive" },
  { id: "cansada",       label: "Cansada",       emoji: "😴", valence: "negative" },
  { id: "ansiosa",       label: "Ansiosa",       emoji: "😰", valence: "negative" },
  { id: "triste",        label: "Triste",        emoji: "😢", valence: "negative" },
  { id: "irritada",      label: "Irritada",      emoji: "😤", valence: "negative" },
  { id: "sobrecarregada",label: "Sobrecarregada",emoji: "🌊", valence: "negative" },
];

export function getMoodById(id: string): MoodChip | undefined {
  return MOOD_CHIPS.find((m) => m.id === id);
}
