import { pgTable, text, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { z } from "zod";
import { Types } from "mongoose";
// Define custom Zod schemas for MongoDB
var ObjectIdSchema = z.instanceof(Types.ObjectId).or(z.string().transform(function (val) {
    return typeof val === 'string' ? new Types.ObjectId(val) : val;
}));
// User schema (both admin and students)
export var users = pgTable("users", {
    id: text("id").primaryKey(), // Using string for MongoDB ObjectIds
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    role: text("role").notNull().default("student"),
    email: text("email"),
    studentId: text("student_id").unique(),
    registrationDate: timestamp("registration_date").defaultNow(),
});
// Custom user schema for MongoDB that better matches our models
export var insertUserSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
    role: z.string().default("student"),
    email: z.string().optional(),
    studentId: z.string().optional(),
});
// Questions schema
export var questions = pgTable("questions", {
    id: text("id").primaryKey(), // Using string for MongoDB ObjectIds
    title: text("title").notNull(),
    content: text("content").notNull(),
    type: text("type").notNull(), // multiple-choice, code
    category: text("category").notNull(),
    difficulty: text("difficulty").notNull().default("medium"),
    options: json("options").$type(),
    correctAnswer: text("correct_answer").notNull(),
});
// Custom question schema for MongoDB that better matches our models
export var insertQuestionSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    type: z.string().min(1),
    category: z.string().min(1),
    difficulty: z.string().default("medium"),
    options: z.array(z.string()), // Required field
    correctAnswer: z.string().min(1),
});
// Assessments schema
export var assessments = pgTable("assessments", {
    id: text("id").primaryKey(), // Using string for MongoDB ObjectIds
    userId: text("user_id").notNull(), // Foreign key to users
    startTime: timestamp("start_time").notNull().defaultNow(),
    endTime: timestamp("end_time"),
    timeRemaining: integer("time_remaining"), // in seconds
    isComplete: boolean("is_complete").default(false),
    score: integer("score"),
});
// Custom assessment schema for MongoDB that better matches our models
export var insertAssessmentSchema = z.object({
    userId: z.string().min(1),
    startTime: z.date().optional().default(function () { return new Date(); }),
    timeRemaining: z.number().optional(),
});
// Assessment answers schema
export var answers = pgTable("answers", {
    id: text("id").primaryKey(), // Using string for MongoDB ObjectIds
    assessmentId: text("assessment_id").notNull(), // Foreign key to assessments
    questionId: text("question_id").notNull(), // Foreign key to questions
    answer: text("answer"),
    isCorrect: boolean("is_correct"),
});
// Custom answer schema for MongoDB that better matches our models
export var insertAnswerSchema = z.object({
    assessmentId: z.string().min(1),
    questionId: z.string().min(1),
    answer: z.string().optional(),
    isCorrect: z.boolean().optional().default(false),
});
// Auth related schemas
export var loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});
// Student registration schema
export var registerStudentSchema = insertUserSchema
    .extend({
    confirmPassword: z.string().min(1, "Please confirm password"),
})
    .refine(function (data) { return data.password === data.confirmPassword; }, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
