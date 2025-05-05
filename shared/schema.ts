import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (both admin and students)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"),
  email: text("email"),
  studentId: text("student_id").unique(),
  registrationDate: timestamp("registration_date").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  email: true,
  studentId: true,
});

// Questions schema
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // multiple-choice, code
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull().default("medium"),
  options: json("options").$type<string[]>(),
  correctAnswer: text("correct_answer").notNull(),
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  title: true,
  content: true,
  type: true,
  category: true,
  difficulty: true,
  options: true,
  correctAnswer: true,
});

// Assessments schema
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  timeRemaining: integer("time_remaining"), // in seconds
  isComplete: boolean("is_complete").default(false),
  score: integer("score"),
});

export const insertAssessmentSchema = createInsertSchema(assessments).pick({
  userId: true,
  startTime: true,
  timeRemaining: true,
});

// Assessment answers schema
export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  questionId: integer("question_id").notNull(),
  answer: text("answer"),
  isCorrect: boolean("is_correct"),
});

export const insertAnswerSchema = createInsertSchema(answers).pick({
  assessmentId: true,
  questionId: true,
  answer: true,
  isCorrect: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Question = typeof questions.$inferSelect & { 
  studentAnswer?: string;  // Only used on the client, not stored in DB 
};
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;

export type Answer = typeof answers.$inferSelect;
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
