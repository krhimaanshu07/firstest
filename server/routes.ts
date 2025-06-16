import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, MongoDBStorage } from "./storage.js";
import { 
  registerStudentSchema, 
  insertQuestionSchema,
  insertAssessmentSchema,
  insertAnswerSchema
} from "@shared/schema";
import { z } from "zod";
import { addCSQuestions } from "./add-cs-questions-api";

// Constants
const TWO_HOURS_IN_MS = 3600000; // 2 hours in milliseconds
const TWO_HOURS_IN_SECONDS = 3600; // 2 hours in seconds

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware for protected routes (using passport auth)
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Admin-only middleware
  const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admin only" });
    }
    next();
  };

  // Auth routes are set up in auth.ts

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
      // Handle null values for MongoDB compatibility
      const newUser = await storage.createUser({
        ...userData,
        role: "student",
        email: userData.email || undefined,
        studentId: userData.studentId || undefined
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

  // Delete a student
  app.delete("/api/students/:id", requireAdmin, async (req, res) => {
    try {
      const studentId = req.params.id;
      
      // First get the student to make sure they exist
      const student = await storage.getUser(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Make sure we're not deleting an admin
      if (student.role === "admin") {
        return res.status(403).json({ message: "Cannot delete admin users" });
      }
      
      // Delete the student's assessments
      const assessments = await storage.getAssessmentsByUser(studentId);
      for (const assessment of assessments) {
        // Delete answers for each assessment
        const answers = await storage.getAnswersByAssessment(assessment.id);
        for (const answer of answers) {
          await storage.deleteAnswer(answer.id);
        }
        // Delete the assessment
        await storage.deleteAssessment(assessment.id);
      }
      
      // Delete the student
      const success = await storage.deleteUser(studentId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete student" });
      }
      
      return res.status(200).json({ message: "Student deleted successfully" });
    } catch (error) {
      console.error("Error deleting student:", error);
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
      const questionId = req.params.id;
      // MongoDB can handle string IDs directly
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
      const questionId = req.params.id;
      
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
      const questionId = req.params.id;
      
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
      // Check if user exists
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Only students can take assessments
      if (req.user.role !== "student") {
        return res.status(403).json({ message: "Only students can take assessments" });
      }

      // Check if student already has an active assessment
      const userId = req.user.id;
      const userAssessments = await storage.getAssessmentsByUser(userId);
      
      // Find active (incomplete) assessment
      const activeAssessment = userAssessments.find(a => !a.isComplete);
      
      // Check if student has completed an assessment recently (within 24 hours)
      const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const recentlyCompletedAssessment = userAssessments.find(a => {
        // Assessment must be complete
        if (!a.isComplete) return false;
        
        // Check if assessment was completed in the last 24 hours
        // Skip assessments without an endTime
        if (!a.endTime) return false;
        
        // Handle endTime safely
        const endTimeDate = new Date(a.endTime);
        const completionTime = endTimeDate.getTime();
        const currentTime = new Date().getTime();
        return (currentTime - completionTime) < ONE_DAY_MS;
      });
      
      // Temporarily disable the 24-hour restriction to allow students to take assessments
      // TODO: Re-enable this restriction when needed
      /*
      // If student has completed an assessment recently, prevent them from starting a new one
      if (recentlyCompletedAssessment && !activeAssessment) {
        const completionTime = new Date(recentlyCompletedAssessment.endTime || new Date()).getTime();
        const currentTime = new Date().getTime();
        const timeElapsedMs = currentTime - completionTime;
        const timeRemainingMs = ONE_DAY_MS - timeElapsedMs;
        
        // Convert to hours and minutes
        const hoursRemaining = Math.floor(timeRemainingMs / (60 * 60 * 1000));
        const minutesRemaining = Math.floor((timeRemainingMs % (60 * 60 * 1000)) / (60 * 1000));
        
        return res.status(403).json({ 
          message: `You have already completed an assessment. Please wait ${hoursRemaining} hours and ${minutesRemaining} minutes before starting a new one.`,
          waitTime: {
            hours: hoursRemaining,
            minutes: minutesRemaining
          },
          isRestricted: true
        });
      }
      */

      if (activeAssessment) {
        // Continue existing assessment
        
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
      const DEFAULT_ASSESSMENT_TIME = TWO_HOURS_IN_SECONDS; // 2 hours in seconds
      
      // Make sure userId is a string when passed to MongoDB
      const userIdStr = userId.toString();
      
      // Create assessment
      let assessment;
      try {
        assessment = await storage.createAssessment({
          userId: userIdStr,
          startTime: new Date(),
          timeRemaining: DEFAULT_ASSESSMENT_TIME
        });
      } catch (error) {
        console.error("Error creating assessment:", error);
        return res.status(500).json({ message: "Failed to create assessment" });
      }

      // Get 40 questions for the assessment
      const questions = await storage.getRandomQuestions(40);
      
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
      // Debug log
      console.log('[submit-answer] req.user:', req.user);
      // Check if user exists
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const assessmentId = req.params.id;
      // Verify it's the student's own assessment
      const assessment = await storage.getAssessment(assessmentId);
      console.log('[submit-answer] assessment.userId:', assessment ? assessment.userId : null);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Use string comparison for MongoDB IDs
      const userIdStr = req.user.id.toString();
      let assessmentUserIdStr = null;
      if (assessment.userId) {
        if (typeof assessment.userId === 'object' && assessment.userId._id) {
          assessmentUserIdStr = assessment.userId._id.toString();
        } else {
          assessmentUserIdStr = assessment.userId.toString();
        }
      }
      if (!assessmentUserIdStr || assessmentUserIdStr !== userIdStr) {
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
      
      // Find by comparing string representation of IDs
      const alreadyAnswered = existingAnswers.find(a => 
        a.questionId.toString() === answerData.questionId.toString()
      );
      
      if (alreadyAnswered) {
        // Update existing answer
        const userAnswer = answerData.answer || '';
        const isCorrect = userAnswer === question.correctAnswer;
        await storage.updateAnswer(alreadyAnswered.id, {
          assessmentId: assessmentId.toString(),
          questionId: answerData.questionId.toString(),
          answer: userAnswer,
          isCorrect
        });
      } else {
        // Create new answer
        const userAnswer = answerData.answer || '';
        const isCorrect = userAnswer === question.correctAnswer;
        await storage.createAnswer({
          assessmentId: assessmentId.toString(),
          questionId: answerData.questionId.toString(),
          answer: userAnswer,
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
      // Debug log
      console.log('[update-timer] req.user:', req.user);
      // Check if user exists
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const assessmentId = req.params.id;
      // Verify it's the student's own assessment
      const assessment = await storage.getAssessment(assessmentId);
      console.log('[update-timer] assessment.userId:', assessment ? assessment.userId : null);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Validate time remaining
      const { timeRemaining } = req.body;
      if (typeof timeRemaining !== "number" || timeRemaining < 0) {
        return res.status(400).json({ message: "Invalid time remaining" });
      }

      // Use string comparison for MongoDB IDs
      const userIdStr = req.user.id.toString();
      let assessmentUserIdStr = null;
      if (assessment.userId) {
        if (typeof assessment.userId === 'object' && assessment.userId._id) {
          assessmentUserIdStr = assessment.userId._id.toString();
        } else {
          assessmentUserIdStr = assessment.userId.toString();
        }
      }
      if (!assessmentUserIdStr || assessmentUserIdStr !== userIdStr) {
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
      // Check if user exists
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const assessmentId = req.params.id;

      // Verify it's the student's own assessment
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Use string comparison for MongoDB IDs
      const userIdStr = req.user.id.toString();
      let assessmentUserIdStr = null;
      if (assessment.userId) {
        if (typeof assessment.userId === 'object' && assessment.userId._id) {
          assessmentUserIdStr = assessment.userId._id.toString();
        } else {
          assessmentUserIdStr = assessment.userId.toString();
        }
      }
      if (!assessmentUserIdStr || assessmentUserIdStr !== userIdStr) {
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
  
  // Get a single assessment
  app.get("/api/assessments/:id", requireAuth, async (req, res) => {
    try {
      // Debug log
      console.log('[get-assessment] req.user:', req.user);
      // Check if user exists
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const assessmentId = req.params.id;
      const assessment = await storage.getAssessment(assessmentId);
      console.log('[get-assessment] assessment.userId:', assessment ? assessment.userId : null);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Use string comparison for MongoDB IDs
      const userIdStr = req.user.id.toString();
      let assessmentUserIdStr = null;
      if (assessment.userId) {
        if (typeof assessment.userId === 'object' && assessment.userId._id) {
          assessmentUserIdStr = assessment.userId._id.toString();
        } else {
          assessmentUserIdStr = assessment.userId.toString();
        }
      }
      // Only allow access to the student's own assessment or admin
      if (!assessmentUserIdStr || (assessmentUserIdStr !== userIdStr && req.user.role !== 'admin')) {
        return res.status(403).json({ message: "Not authorized to view this assessment" });
      }

      const answers = await storage.getAnswersByAssessment(assessmentId);
      
      return res.status(200).json({
        ...assessment,
        answeredQuestions: answers.length,
        correctAnswers: answers.filter(a => a.isCorrect).length
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get all assessments (admin only)
  app.get("/api/assessments", requireAdmin, async (req, res) => {
    try {
      const assessments = await storage.getAllAssessments();
      
      // Enhance with user information and answer counts
      const enhancedAssessments = await Promise.all(assessments.map(async (assessment) => {
        // Check if userId is already populated (MongoDB populate)
        let user = null;
        if (assessment.userId && typeof assessment.userId === 'object' && 'username' in assessment.userId) {
          // userId is already populated, use it directly
          user = assessment.userId as any;
        } else if (assessment.userId) {
          // userId is just an ID, fetch the user
          const userIdStr = assessment.userId.toString();
          user = await storage.getUser(userIdStr);
        }
        
        const answers = await storage.getAnswersByAssessment(assessment.id);
        
        return {
          ...assessment,
          student: user && 'username' in user ? {
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
      console.error("Error getting all assessments:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Delete all assessments (admin only)
  app.delete("/api/assessments", requireAdmin, async (req, res) => {
    try {
      // Get all assessments
      const assessments = await storage.getAllAssessments();
      
      // For each assessment, delete all answers
      for (const assessment of assessments) {
        const answers = await storage.getAnswersByAssessment(assessment.id);
        for (const answer of answers) {
          await storage.deleteAnswer(answer.id);
        }
        // Delete the assessment
        await storage.deleteAssessment(assessment.id);
      }
      
      return res.status(200).json({ message: "All assessments deleted successfully" });
    } catch (error) {
      console.error("Error deleting assessments:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Add 40 fresh CS questions - admin only
  app.post("/api/questions/add-cs-questions", requireAdmin, async (req, res) => {
    try {
      // Pass the storage directly since we've made the function accept any type
      const result = await addCSQuestions(storage);
      return res.status(200).json(result);
    } catch (err) {
      const error = err as Error;
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  // Add 30 easy simple math questions - admin only
  app.post("/api/questions/add-math-questions", requireAdmin, async (req, res) => {
    try {
      const mathQuestions = [
        {
          title: "Basic Addition",
          content: "What is 5 + 3?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["6", "7", "8", "9"],
          correctAnswer: "8"
        },
        {
          title: "Simple Subtraction",
          content: "What is 10 - 4?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["4", "5", "6", "7"],
          correctAnswer: "6"
        },
        {
          title: "Basic Multiplication",
          content: "What is 4 × 3?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["9", "10", "11", "12"],
          correctAnswer: "12"
        },
        {
          title: "Simple Division",
          content: "What is 15 ÷ 3?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["3", "4", "5", "6"],
          correctAnswer: "5"
        },
        {
          title: "Number Sequence",
          content: "What comes next: 2, 4, 6, 8, __?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["9", "10", "11", "12"],
          correctAnswer: "10"
        },
        {
          title: "Even Numbers",
          content: "Which of these is an even number?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["7", "9", "11", "12"],
          correctAnswer: "12"
        },
        {
          title: "Odd Numbers",
          content: "Which of these is an odd number?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["8", "10", "12", "13"],
          correctAnswer: "13"
        },
        {
          title: "Counting",
          content: "How many sides does a triangle have?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["2", "3", "4", "5"],
          correctAnswer: "3"
        },
        {
          title: "Basic Addition 2",
          content: "What is 7 + 6?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["11", "12", "13", "14"],
          correctAnswer: "13"
        },
        {
          title: "Simple Subtraction 2",
          content: "What is 20 - 8?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["10", "11", "12", "13"],
          correctAnswer: "12"
        },
        {
          title: "Basic Multiplication 2",
          content: "What is 5 × 4?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["15", "18", "20", "25"],
          correctAnswer: "20"
        },
        {
          title: "Simple Division 2",
          content: "What is 24 ÷ 6?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["3", "4", "5", "6"],
          correctAnswer: "4"
        },
        {
          title: "Number Comparison",
          content: "Which number is greater: 15 or 12?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["12", "15", "They are equal", "Cannot determine"],
          correctAnswer: "15"
        },
        {
          title: "Basic Addition 3",
          content: "What is 9 + 8?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["15", "16", "17", "18"],
          correctAnswer: "17"
        },
        {
          title: "Simple Subtraction 3",
          content: "What is 25 - 7?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["16", "17", "18", "19"],
          correctAnswer: "18"
        },
        {
          title: "Basic Multiplication 3",
          content: "What is 6 × 5?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["25", "30", "35", "40"],
          correctAnswer: "30"
        },
        {
          title: "Simple Division 3",
          content: "What is 35 ÷ 7?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["4", "5", "6", "7"],
          correctAnswer: "5"
        },
        {
          title: "Number Sequence 2",
          content: "What comes next: 5, 10, 15, 20, __?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["22", "25", "30", "35"],
          correctAnswer: "25"
        },
        {
          title: "Counting 2",
          content: "How many sides does a square have?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["3", "4", "5", "6"],
          correctAnswer: "4"
        },
        {
          title: "Basic Addition 4",
          content: "What is 11 + 9?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["18", "19", "20", "21"],
          correctAnswer: "20"
        },
        {
          title: "Simple Subtraction 4",
          content: "What is 30 - 12?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["16", "17", "18", "19"],
          correctAnswer: "18"
        },
        {
          title: "Basic Multiplication 4",
          content: "What is 7 × 6?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["36", "40", "42", "48"],
          correctAnswer: "42"
        },
        {
          title: "Simple Division 4",
          content: "What is 48 ÷ 8?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["5", "6", "7", "8"],
          correctAnswer: "6"
        },
        {
          title: "Number Comparison 2",
          content: "Which number is smaller: 18 or 22?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["18", "22", "They are equal", "Cannot determine"],
          correctAnswer: "18"
        },
        {
          title: "Basic Addition 5",
          content: "What is 13 + 7?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["18", "19", "20", "21"],
          correctAnswer: "20"
        },
        {
          title: "Simple Subtraction 5",
          content: "What is 40 - 15?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["20", "25", "30", "35"],
          correctAnswer: "25"
        },
        {
          title: "Basic Multiplication 5",
          content: "What is 8 × 4?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["28", "30", "32", "36"],
          correctAnswer: "32"
        },
        {
          title: "Simple Division 5",
          content: "What is 56 ÷ 7?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["6", "7", "8", "9"],
          correctAnswer: "8"
        },
        {
          title: "Number Sequence 3",
          content: "What comes next: 3, 6, 9, 12, __?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["13", "14", "15", "16"],
          correctAnswer: "15"
        },
        {
          title: "Counting 3",
          content: "How many sides does a pentagon have?",
          type: "multiple-choice",
          category: "Mathematics",
          difficulty: "easy",
          options: ["4", "5", "6", "7"],
          correctAnswer: "5"
        }
      ];

      let addedCount = 0;
      for (const questionData of mathQuestions) {
        try {
          await storage.createQuestion(questionData);
          addedCount++;
        } catch (error) {
          console.error(`Error adding question "${questionData.title}":`, error);
        }
      }

      return res.status(200).json({
        message: `Successfully added ${addedCount} math questions to the database`,
        addedCount,
        totalQuestions: mathQuestions.length
      });
    } catch (error) {
      console.error("Error adding math questions:", error);
      return res.status(500).json({ 
        message: "Server error", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
