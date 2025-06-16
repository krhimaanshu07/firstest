import { z } from "zod";
import { Types } from "mongoose";

// Define custom Zod schemas for MongoDB
var ObjectIdSchema = z.instanceof(Types.ObjectId).or(z.string().transform(function (val) {
    return typeof val === 'string' ? new Types.ObjectId(val) : val;
}));

// Custom user schema for MongoDB that better matches our models
export var insertUserSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
    role: z.string().default("student"),
    email: z.string().optional(),
    studentId: z.string().optional(),
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

// Custom assessment schema for MongoDB that better matches our models
export var insertAssessmentSchema = z.object({
    userId: z.string().min(1),
    startTime: z.date().optional().default(function () { return new Date(); }),
    timeRemaining: z.number().optional(),
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
