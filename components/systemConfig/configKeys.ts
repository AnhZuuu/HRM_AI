import { z } from "zod";

export const ConfigSchema = z.object({
  INTERVIEW_FEEDBACK_EARLY_MINUTES: z.number().int().min(0).default(0),
  INTERVIEW_FEEDBACK_LATE_MINUTES: z.number().int().min(0).default(0),
  ALLOW_PRE_INTERVIEW_FEEDBACK: z.boolean().default(false),
  USE_SERVER_TIME: z.boolean().default(true),
});

export type ConfigShape = z.infer<typeof ConfigSchema>;

export const DEFAULT_CONFIG: ConfigShape = ConfigSchema.parse({});
export const CONFIG_STORAGE_KEY = "hrm_fe_config_v1";
