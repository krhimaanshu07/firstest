import { z } from "zod";
import { Types } from "mongoose";

// Define custom Zod schemas for MongoDB
const ObjectIdSchema = z.instanceof(Types.ObjectId).or(z.string().transform(val => 
  typeof val === 'string' ? new Types.ObjectId(val) : val
));

// Custom user schema for MongoDB that better matches our models
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.string().default("student"),
  email: z.string().optional(),
  studentId: z.string().optional(),
});

// Custom question schema for MongoDB that better matches our models
export const insertQuestionSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.string().min(1),
  category: z.string().min(1),
  difficulty: z.string().default("medium"),
  options: z.array(z.string()), // Required field
  correctAnswer: z.string().min(1),
});

// Custom assessment schema for MongoDB that better matches our models
export const insertAssessmentSchema = z.object({
  userId: z.string().min(1),
  startTime: z.date().optional().default(() => new Date()),
  timeRemaining: z.number().optional(),
});

// Custom answer schema for MongoDB that better matches our models
export const insertAnswerSchema = z.object({
  assessmentId: z.string().min(1),
  questionId: z.string().min(1),
  answer: z.string().optional(),
  isCorrect: z.boolean().optional().default(false),
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Question = { 
  id: string;
  title: string;
  content: string;
  type: string;
  category: string;
  difficulty: string;
  options: string[];
  correctAnswer: string;
  studentAnswer?: string;  // Only used on the client, not stored in DB
};
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Assessment = {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  timeRemaining?: number;
  isComplete: boolean;
  score?: number;
};
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;

export type Answer = {
  id: string;
  assessmentId: string;
  questionId: string;
  answer?: string;
  isCorrect?: boolean;
};
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;

// Auth related schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// Student registration schema
export const registerStudentSchema = insertUserSchema
  .extend({
    confirmPassword: z.string().min(1, "Please confirm password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterStudent = z.infer<typeof registerStudentSchema>;
