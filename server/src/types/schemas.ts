import { z } from "zod";

export const createUserSchema = z.object({
  username: z
    .string({ required_error: "ইউজারনেম দরকার" })
    .trim()
    .min(1, "ইউজারনেম খালি রাখা যাবে না")
    .max(30, "ইউজারনেম সর্বোচ্চ ৩০ অক্ষরের হতে পারে"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

const usernameField = z
  .string({ required_error: "ইউজারনেম দরকার" })
  .trim()
  .min(1, "ইউজারনেম খালি রাখা যাবে না")
  .max(30, "ইউজারনেম সর্বোচ্চ ৩০ অক্ষরের হতে পারে");

const passwordField = z
  .string({ required_error: "পাসওয়ার্ড দরকার" })
  .min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে")
  .max(72, "পাসওয়ার্ড সর্বোচ্চ ৭২ অক্ষরের হতে পারে");

export const signupSchema = z.object({
  username: usernameField,
  password: passwordField,
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  username: usernameField,
  password: z
    .string({ required_error: "পাসওয়ার্ড দরকার" })
    .min(1, "পাসওয়ার্ড দিন")
    .max(72, "পাসওয়ার্ড সর্বোচ্চ ৭২ অক্ষরের হতে পারে"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createPostSchema = z.object({
  title: z
    .string({ required_error: "পরীক্ষার শিরোনাম দরকার" })
    .trim()
    .min(1, "শিরোনাম খালি রাখা যাবে না")
    .max(120, "শিরোনাম সর্বোচ্চ ১২০ অক্ষরের হতে পারে"),
  content: z
    .string()
    .trim()
    .max(5000, "বর্ণনা সর্বোচ্চ ৫০০০ অক্ষরের হতে পারে")
    .optional()
    .default(""),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const awardSchema = z.object({
  userId: z
    .string({ required_error: "userId দরকার" })
    .regex(/^[a-fA-F0-9]{24}$/, "userId একটি সঠিক ObjectId হতে হবে"),
});

// Public self-pass: a team member marks their own pass on an exam
export const selfPassSchema = awardSchema;

export type AwardInput = z.infer<typeof awardSchema>;
