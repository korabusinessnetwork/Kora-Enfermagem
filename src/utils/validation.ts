import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido. Verifique e tente novamente.'),
  password: z.string().min(1, 'Senha é obrigatória.'),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres.'),
  hospitalName: z.string().min(2, 'Nome do hospital deve ter ao menos 2 caracteres.'),
  email: z.string().email('Email inválido. Verifique e tente novamente.'),
  password: z
    .string()
    .min(8, 'Senha deve ter 8+ caracteres, com letras e números.')
    .regex(/[A-Za-z]/, 'Senha deve ter 8+ caracteres, com letras e números.')
    .regex(/[0-9]/, 'Senha deve ter 8+ caracteres, com letras e números.'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
