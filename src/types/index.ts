export interface CheckIn {
  id: string;
  user_id: string;
  date: string;
  felt_judged: boolean;
  took_medication: boolean;
  talked_to_someone: boolean;
  meditation_prayer_breathing: boolean;
  creative_activity: boolean;
  ate_well: boolean;
  bowel_movement: boolean;
  exercise_walk: boolean;
  drank_water: boolean;
  slept_well: boolean;
  suicidal_thoughts: boolean;
  did_something_enjoyable: boolean;
  worked_on_goals: boolean;
  feeling: string;
  gratitude: string;
  created_at: string;
  updated_at: string;
}

export type CheckInFormData = Omit<CheckIn, "id" | "user_id" | "created_at" | "updated_at">;

export interface CheckInStats {
  total_checkins: number;
  current_streak: number;
  best_streak: number;
  completion_rate_7d: number;
  completion_rate_30d: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  tier: number;
  unlocked_at: string;
  metadata: Record<string, unknown>;
}

export interface DiaryEntry {
  id: string;
  user_id: string;
  date: string;
  title: string;
  content: string;
  mood: number | null;
  created_at: string;
  updated_at: string;
}

export type MealType = "cafe_da_manha" | "almoco" | "lanche" | "jantar" | "lanche_noturno";

export type MealClassification =
  | "equilibrada"
  | "leve_proteina"
  | "alta_acucar"
  | "alta_gordura"
  | "vegetais_baixo"
  | "nao_identificada";

export interface Macros {
  carboidratos_g: number;
  proteinas_g: number;
  gorduras_g: number;
  calorias_kcal: number;
}

export interface MealItem {
  nome: string;
  quantidade?: string;
}

export type MealAnalysisStatus = "pendente" | "analisado" | "falha";

export interface Meal {
  id: string;
  user_id: string;
  data_hora: string;
  tipo_refeicao: MealType;
  foto_path: string | null;
  itens: MealItem[];
  macros: Macros | null;
  classificacao: MealClassification | null;
  observacao: string;
  texto_livre: string;
  status_analise: MealAnalysisStatus;
  criado_em: string;
}

export interface MealFormData {
  data_hora: string;
  tipo_refeicao: MealType;
  foto_path: string | null;
  itens: MealItem[];
  macros: Macros | null;
  classificacao: MealClassification | null;
  observacao: string;
  texto_livre: string;
  status_analise: MealAnalysisStatus;
}

export interface DailyNutritionSummary {
  total_calorias: number;
  total_carboidratos: number;
  total_proteinas: number;
  total_gorduras: number;
  refeicoes: Meal[];
  qualidade: "bom" | "atencao" | "sem_dados";
}
