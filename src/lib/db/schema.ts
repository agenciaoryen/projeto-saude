import {
  pgTable,
  uuid,
  date,
  boolean,
  text,
  timestamp,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";

const ALL_QUESTION_KEYS = [
  "feltJudged",
  "tookMedication",
  "talkedToSomeone",
  "meditationPrayerBreathing",
  "creativeActivity",
  "ateWell",
  "bowelMovement",
  "exerciseWalk",
  "drankWater",
  "sleptWell",
  "suicidalThoughts",
  "didSomethingEnjoyable",
  "workedOnGoals",
] as const;

export { ALL_QUESTION_KEYS };

export const checkIns = pgTable(
  "check_ins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    date: date("date").notNull(),
    feltJudged: boolean("felt_judged").notNull().default(false),
    tookMedication: boolean("took_medication").notNull().default(false),
    talkedToSomeone: boolean("talked_to_someone").notNull().default(false),
    meditationPrayerBreathing: boolean("meditation_prayer_breathing")
      .notNull()
      .default(false),
    creativeActivity: boolean("creative_activity").notNull().default(false),
    ateWell: boolean("ate_well").notNull().default(false),
    bowelMovement: boolean("bowel_movement").notNull().default(false),
    exerciseWalk: boolean("exercise_walk").notNull().default(false),
    drankWater: boolean("drank_water").notNull().default(false),
    sleptWell: boolean("slept_well").notNull().default(false),
    suicidalThoughts: boolean("suicidal_thoughts").notNull().default(false),
    didSomethingEnjoyable: boolean("did_something_enjoyable")
      .notNull()
      .default(false),
    workedOnGoals: boolean("worked_on_goals").notNull().default(false),
    feeling: text("feeling").notNull().default(""),
    gratitude: text("gratitude").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userDateIdx: uniqueIndex("user_date_idx").on(table.userId, table.date),
  })
);

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id").primaryKey(),
  enabledQuestions: text("enabled_questions").array().notNull().default([]),
  context: jsonb("context").notNull().default({}),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
