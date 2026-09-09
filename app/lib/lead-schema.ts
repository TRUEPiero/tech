import { z } from "zod";

export const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Укажите имя")
    .max(100, "Имя слишком длинное"),
  phone: z
    .string()
    .trim()
    .min(7, "Укажите телефон")
    .max(30, "Проверьте номер телефона")
    .regex(/^[+()\-\s\d]+$/, "Проверьте номер телефона"),
  email: z
    .string()
    .trim()
    .email("Проверьте email")
    .max(160, "Email слишком длинный")
    .optional()
    .or(z.literal("")),
  consent: z.boolean().refine((value) => value, {
    message: "Необходимо согласие на обработку данных",
  }),
  website: z.string().max(0).optional(),
});

export type LeadFormValues = z.infer<typeof leadSchema>;
