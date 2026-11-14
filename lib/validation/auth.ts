import { z } from "zod";

export const registerSchema = z
  .object({
    email: z
      .string()
      .email("Veuillez saisir une adresse e-mail valide.")
      .toLowerCase()
      .trim(),
    username: z
      .string()
      .min(3, "Le nom d'utilisateur doit comporter au moins 3 caractères.")
      .max(30, "Le nom d'utilisateur ne doit pas dépasser 30 caractères.")
      .regex(
        /^[a-zA-Z0-9_.-]+$/,
        "Lettres, chiffres, tirets et underscores uniquement."
      )
      .toLowerCase()
      .trim(),
    country: z.string().min(2, "Veuillez sélectionner votre pays."),
    phone: z
      .string()
      .min(6, "Veuillez saisir un numéro de téléphone valide.")
      .max(25, "Numéro de téléphone trop long.")
      .trim(),
    upline: z.string().optional().or(z.literal("")),
    password: z
      .string()
      .min(6, "Le mot de passe doit comporter au moins 6 caractères.")
      .max(100, "Le mot de passe est trop long."),
    confirmPassword: z.string().min(1, "Veuillez confirmer votre mot de passe."),
    termsAccepted: z
      .boolean()
      .refine((val) => val === true, "Vous devez accepter les conditions d'utilisation."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, "Veuillez saisir votre nom d'utilisateur ou votre adresse e-mail.")
    .trim(),
  password: z.string().min(1, "Le mot de passe est requis."),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Veuillez saisir une adresse e-mail valide.")
    .toLowerCase()
    .trim(),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Le mot de passe doit comporter au moins 6 caractères.")
      .max(100, "Le mot de passe est trop long."),
    confirmPassword: z.string().min(1, "Veuillez confirmer votre mot de passe."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
