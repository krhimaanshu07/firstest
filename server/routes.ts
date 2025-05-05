import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { 
  loginSchema, 
  insertUserSchema, 
  registerStudentSchema, 
  insertQuestionSchema,
  insertAssessmentSchema,
  insertAnswerSchema
} from "@shared/schema";
import { z } from "zod";

// Extend Express Session
declare module 'express-session' {
  interface SessionData {
    userId: number;
    role: string;
    assessmentId?: number;
  }
}

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-session-secret";
const TWO_HOURS_IN_MS = 7200000;

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === "production",
        maxAge: TWO_HOURS_IN_MS
      }
    })
  );

  // Auth middleware for protected routes
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Admin-only middleware
  const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId || req.session.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admin only" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(credentials.username);
      
      if (!user || user.password !== credentials.password) {  // In production use bcrypt
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.role = user.role;

      return res.status(200).json({
        id: user.id,
        username: user.username,
        role: user.role,
        studentId: user.studentId
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        id: user.id,
        username: user.username,
        role: user.role,
        studentId: user.studentId,
        email: user.email
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Student registration
  app.post("/api/students/register", requireAdmin, async (req, res) => {
    try {
      const studentData = registerStudentSchema.parse(req.body);
      
      // Check if username or studentId already exists
      const existingUsername = await storage.getUserByUsername(studentData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      if (studentData.studentId) {
        const existingStudentId = await storage.getUserByStudentId(studentData.studentId);
        if (existingStudentId) {
          return res.status(400).json({ message: "Student ID already exists" });
        }
      }

      const { confirmPassword, ...userData } = studentData;
      
      // Create the student user
      const newUser = await storage.createUser({
        ...userData,
        role: "student"
      });

      return res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        studentId: newUser.studentId,
        email: newUser.email,
        registrationDate: newUser.registrationDate
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get all students
  app.get("/api/students", requireAdmin, async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      return res.status(200).json(students.map(student => ({
        id: student.id,
        username: student.username,
        studentId: student.studentId,
        email: student.email,
        registrationDate: student.registrationDate
      })));
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Question management routes
  app.post("/api/questions", requireAdmin, async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const newQuestion = await storage.createQuestion(questionData);
      return res.status(201).json(newQuestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/questions", requireAuth, async (req, res) => {
    try {
      const questions = await storage.getAllQuestions();
      return res.status(200).json(questions);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/questions/:id", requireAuth, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      if (isNaN(questionId)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }

      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      return res.status(200).json(question);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/questions/:id", requireAdmin, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      if (isNaN(questionId)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }

      const questionData = insertQuestionSchema.partial().parse(req.body);
      const updatedQuestion = await storage.updateQuestion(questionId, questionData);
      
      if (!updatedQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }

      return res.status(200).json(updatedQuestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/questions/:id", requireAdmin, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      if (isNaN(questionId)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }

      const success = await storage.deleteQuestion(questionId);
      if (!success) {
        return res.status(404).json({ message: "Question not found" });
      }

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Assessment routes
  app.post("/api/assessments/start", requireAuth, async (req, res) => {
    try {
      // Only students can take assessments
      if (req.session.role !== "student") {
        return res.status(403).json({ message: "Only students can take assessments" });
      }

      // Check if student already has an active assessment
      const userId = req.session.userId!;
      const userAssessments = await storage.getAssessmentsByUser(userId);
      const activeAssessment = userAssessments.find(a => !a.isComplete);

      if (activeAssessment) {
        // Continue existing assessment
        req.session.assessmentId = activeAssessment.id;
        
        // Calculate questions to fetch
        const assessmentAnswers = await storage.getAnswersByAssessment(activeAssessment.id);
        const answeredQuestionIds = assessmentAnswers.map(a => a.questionId);
        
        // Get randomized questions - we'll mix both answered and unanswered questions
        // but will mark which ones have been answered already
        const questions = await storage.getRandomQuestions(40);
        
        // Create a map of already answered questions for quick lookup
        const answeredQuestionsMap = new Map();
        for (const answer of assessmentAnswers) {
          answeredQuestionsMap.set(answer.questionId, answer.answer);
        }
        
        // Tag questions with the student's answers where applicable
        const questionsWithAnswers = questions.map(q => ({
          ...q,
          studentAnswer: answeredQuestionsMap.has(q.id) ? answeredQuestionsMap.get(q.id) : undefined
        }));

        return res.status(200).json({
          assessmentId: activeAssessment.id,
          timeRemaining: activeAssessment.timeRemaining,
          answeredQuestions: assessmentAnswers.length,
          totalQuestions: 40,
          isComplete: activeAssessment.isComplete,
          questions: questionsWithAnswers
        });
      }

      // Start a new assessment
      const DEFAULT_ASSESSMENT_TIME = 7200; // 2 hours in seconds
      
      const assessment = await storage.createAssessment({
        userId,
        startTime: new Date(),
        timeRemaining: DEFAULT_ASSESSMENT_TIME
      });

      // Get 40 questions for the assessment
      const questions = await storage.getRandomQuestions(40);
      
      req.session.assessmentId = assessment.id;
      
      return res.status(201).json({
        assessmentId: assessment.id,
        timeRemaining: assessment.timeRemaining,
        answeredQuestions: 0,
        totalQuestions: questions.length,
        isComplete: false,
        questions
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/assessments/:id/submit-answer", requireAuth, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      if (isNaN(assessmentId)) {
        return res.status(400).json({ message: "Invalid assessment ID" });
      }

      // Verify it's the student's own assessment
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      if (assessment.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to submit answer to this assessment" });
      }

      if (assessment.isComplete) {
        return res.status(400).json({ message: "Assessment is already complete" });
      }

      // Parse the answer data
      const answerData = insertAnswerSchema.parse(req.body);
      
      // Get the question to check correctness
      const question = await storage.getQuestion(answerData.questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Check if already answered
      const existingAnswers = await storage.getAnswersByAssessment(assessmentId);
      const alreadyAnswered = existingAnswers.find(a => a.questionId === answerData.questionId);
      
      if (alreadyAnswered) {
        // Update existing answer
        const isCorrect = answerData.answer === question.correctAnswer;
        await storage.updateAnswer(alreadyAnswered.id, {
          ...answerData,
          isCorrect
        });
      } else {
        // Create new answer
        const isCorrect = answerData.answer === question.correctAnswer;
        await storage.createAnswer({
          ...answerData,
          isCorrect
        });
      }

      // Check if all questions are answered
      const updatedAnswers = await storage.getAnswersByAssessment(assessmentId);
      if (updatedAnswers.length >= 40) {
        // Calculate score
        const correctAnswers = updatedAnswers.filter(a => a.isCorrect).length;
        const score = Math.round((correctAnswers / updatedAnswers.length) * 100);
        
        // Complete the assessment
        await storage.updateAssessment(assessmentId, {
          isComplete: true,
          endTime: new Date(),
          score
        });

        return res.status(200).json({
          message: "Assessment completed",
          score,
          totalQuestions: updatedAnswers.length,
          correctAnswers
        });
      }

      return res.status(200).json({
        message: "Answer submitted",
        answeredQuestions: updatedAnswers.length,
        totalQuestions: 40
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/assessments/:id/update-timer", requireAuth, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      if (isNaN(assessmentId)) {
        return res.status(400).json({ message: "Invalid assessment ID" });
      }

      // Validate time remaining
      const { timeRemaining } = req.body;
      if (typeof timeRemaining !== "number" || timeRemaining < 0) {
        return res.status(400).json({ message: "Invalid time remaining" });
      }

      // Verify it's the student's own assessment
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      if (assessment.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to update this assessment" });
      }

      if (assessment.isComplete) {
        return res.status(400).json({ message: "Assessment is already complete" });
      }

      // Update assessment time
      await storage.updateAssessment(assessmentId, {
        timeRemaining
      });

      // If time is up, complete the assessment
      if (timeRemaining <= 0) {
        const answers = await storage.getAnswersByAssessment(assessmentId);
        const correctAnswers = answers.filter(a => a.isCorrect).length;
        const score = answers.length > 0 ? Math.round((correctAnswers / answers.length) * 100) : 0;
        
        await storage.updateAssessment(assessmentId, {
          isComplete: true,
          endTime: new Date(),
          score
        });

        return res.status(200).json({
          message: "Time's up! Assessment completed",
          timeRemaining: 0,
          isComplete: true
        });
      }

      return res.status(200).json({
        message: "Timer updated",
        timeRemaining
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Complete an assessment manually
  app.post("/api/assessments/:id/complete", requireAuth, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      if (isNaN(assessmentId)) {
        return res.status(400).json({ message: "Invalid assessment ID" });
      }

      // Verify it's the student's own assessment
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      if (assessment.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to complete this assessment" });
      }

      if (assessment.isComplete) {
        return res.status(400).json({ message: "Assessment is already complete" });
      }

      // Get remaining time (if provided)
      const { timeRemaining } = req.body;

      // Calculate score
      const answers = await storage.getAnswersByAssessment(assessmentId);
      const correctAnswers = answers.filter(a => a.isCorrect).length;
      const totalQuestions = 40; // Assuming 40 questions per assessment
      const score = answers.length > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      
      // Complete the assessment
      await storage.updateAssessment(assessmentId, {
        isComplete: true,
        endTime: new Date(),
        score,
        timeRemaining: typeof timeRemaining === 'number' ? Math.max(0, timeRemaining) : 0
      });

      return res.status(200).json({
        message: "Assessment completed successfully",
        score,
        totalQuestions,
        answeredQuestions: answers.length,
        correctAnswers
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/assessments", requireAdmin, async (req, res) => {
    try {
      const assessments = await storage.getAllAssessments();
      
      // Enhance with user information and answer counts
      const enhancedAssessments = await Promise.all(assessments.map(async (assessment) => {
        const user = await storage.getUser(assessment.userId);
        const answers = await storage.getAnswersByAssessment(assessment.id);
        
        return {
          ...assessment,
          student: user ? {
            id: user.id,
            username: user.username,
            studentId: user.studentId
          } : null,
          answeredQuestions: answers.length,
          correctAnswers: answers.filter(a => a.isCorrect).length
        };
      }));
      
      return res.status(200).json(enhancedAssessments);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
