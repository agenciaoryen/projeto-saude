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
