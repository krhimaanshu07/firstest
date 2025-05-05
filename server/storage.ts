import { 
  User, InsertUser, 
  Question, InsertQuestion,
  Assessment, InsertAssessment,
  Answer, InsertAnswer,
  users, questions, assessments, answers
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByStudentId(studentId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllStudents(): Promise<User[]>;
  
  // Question operations
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  getAllQuestions(): Promise<Question[]>;
  getRandomQuestions(count: number): Promise<Question[]>;
  
  // Assessment operations
  getAssessment(id: number): Promise<Assessment | undefined>;
  getAssessmentsByUser(userId: number): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: number, data: Partial<Assessment>): Promise<Assessment | undefined>;
  getAllAssessments(): Promise<Assessment[]>;
  
  // Answer operations
  getAnswer(id: number): Promise<Answer | undefined>;
  getAnswersByAssessment(assessmentId: number): Promise<Answer[]>;
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  updateAnswer(id: number, data: Partial<InsertAnswer>): Promise<Answer | undefined>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private questions: Map<number, Question>;
  private assessments: Map<number, Assessment>;
  private answers: Map<number, Answer>;
  
  private userId: number;
  private questionId: number;
  private assessmentId: number;
  private answerId: number;
  
  // Add session store
  public sessionStore: session.Store;
  
  constructor() {
    this.users = new Map();
    this.questions = new Map();
    this.assessments = new Map();
    this.answers = new Map();
    
    this.userId = 1;
    this.questionId = 1;
    this.assessmentId = 1;
    this.answerId = 1;
    
    // Initialize memory store for sessions
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      role: "admin",
      email: "admin@example.com"
    });

    // Initialize with sample CS questions
    this.createSampleQuestions();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.studentId === studentId);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { ...user, id, registrationDate: new Date() };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async getAllStudents(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === "student");
  }
  
  // Question operations
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }
  
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const id = this.questionId++;
    const newQuestion: Question = { ...question, id };
    this.questions.set(id, newQuestion);
    return newQuestion;
  }
  
  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined> {
    const existingQuestion = this.questions.get(id);
    if (!existingQuestion) return undefined;
    
    const updatedQuestion = { ...existingQuestion, ...question };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
  }
  
  async getAllQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values());
  }
  
  // Fisher-Yates algorithm for better randomization
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  // Randomize answer options while preserving correct answer
  private randomizeOptions(question: Question): Question {
    // For multiple-choice questions, randomize the options
    if (question.type === 'multiple-choice' && question.options) {
      // Keep track of the correct answer
      const correctAnswer = question.correctAnswer;
      
      // Shuffle the options
      const shuffledOptions = this.shuffleArray(question.options);
      
      // Return a new question with shuffled options
      return {
        ...question,
        options: shuffledOptions,
        // Original correctAnswer (e.g. "Option A") stays the same
        correctAnswer
      };
    }
    
    // For other question types or if no options, return as is
    return question;
  }

  async getRandomQuestions(count: number): Promise<Question[]> {
    const allQuestions = Array.from(this.questions.values());
    
    // First, randomize the order of questions
    const shuffledQuestions = this.shuffleArray(allQuestions);
    const selectedQuestions = shuffledQuestions.slice(0, Math.min(count, shuffledQuestions.length));
    
    // Then randomize options for each question
    return selectedQuestions.map(q => this.randomizeOptions(q));
  }
  
  // Assessment operations
  async getAssessment(id: number): Promise<Assessment | undefined> {
    return this.assessments.get(id);
  }
  
  async getAssessmentsByUser(userId: number): Promise<Assessment[]> {
    return Array.from(this.assessments.values()).filter(assessment => assessment.userId === userId);
  }
  
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const id = this.assessmentId++;
    const newAssessment: Assessment = { 
      ...assessment, 
      id, 
      isComplete: false,
      endTime: undefined,
      score: undefined
    };
    this.assessments.set(id, newAssessment);
    return newAssessment;
  }
  
  async updateAssessment(id: number, data: Partial<Assessment>): Promise<Assessment | undefined> {
    const existingAssessment = this.assessments.get(id);
    if (!existingAssessment) return undefined;
    
    const updatedAssessment = { ...existingAssessment, ...data };
    this.assessments.set(id, updatedAssessment);
    return updatedAssessment;
  }
  
  async getAllAssessments(): Promise<Assessment[]> {
    return Array.from(this.assessments.values());
  }
  
  // Answer operations
  async getAnswer(id: number): Promise<Answer | undefined> {
    return this.answers.get(id);
  }
  
  async getAnswersByAssessment(assessmentId: number): Promise<Answer[]> {
    return Array.from(this.answers.values()).filter(answer => answer.assessmentId === assessmentId);
  }
  
  async createAnswer(answer: InsertAnswer): Promise<Answer> {
    const id = this.answerId++;
    const newAnswer: Answer = { ...answer, id };
    this.answers.set(id, newAnswer);
    return newAnswer;
  }
  
  async updateAnswer(id: number, data: Partial<InsertAnswer>): Promise<Answer | undefined> {
    const existingAnswer = this.answers.get(id);
    if (!existingAnswer) return undefined;
    
    const updatedAnswer = { ...existingAnswer, ...data };
    this.answers.set(id, updatedAnswer);
    return updatedAnswer;
  }

  // Create sample CS questions
  private async createSampleQuestions() {
    const sampleQuestions: InsertQuestion[] = [
      {
        title: "Binary Search Algorithm",
        content: "What is the time complexity of binary search algorithm?",
        type: "multiple-choice",
        category: "Algorithms",
        difficulty: "medium",
        options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
        correctAnswer: "O(log n)"
      },
      {
        title: "Stack Implementation",
        content: "Which data structure is typically used to implement a stack?",
        type: "multiple-choice",
        category: "Data Structures",
        difficulty: "medium",
        options: ["Array", "Linked List", "Both A and B", "None of the above"],
        correctAnswer: "Both A and B"
      },
      {
        title: "Time Complexity Analysis",
        content: "What is the time complexity of inserting an element into a sorted array?",
        type: "multiple-choice",
        category: "Algorithms",
        difficulty: "medium",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correctAnswer: "O(n)"
      },
      {
        title: "Recursion Fundamentals",
        content: "What are the two base components of a recursive function?",
        type: "multiple-choice",
        category: "Programming",
        difficulty: "medium",
        options: ["Base case and recursive case", "Iterative part and recursive part", "Start condition and end condition", "Entry point and exit point"],
        correctAnswer: "Base case and recursive case"
      },
      {
        title: "Fibonacci Sequence Implementation",
        content: "Write a function to calculate the nth Fibonacci number using recursion.",
        type: "code",
        category: "Programming",
        difficulty: "medium",
        options: [],
        correctAnswer: "function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}"
      }
    ];

    for (const question of sampleQuestions) {
      await this.createQuestion(question);
    }
  }
}

// Database implementation of IStorage
export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;
  
  constructor() {
    // Set up PostgreSQL session store
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // Utility to help with correct types in PostgreSQL operations
  private mapToNullable<T>(value: T | undefined): T | null {
    return value === undefined ? null : value;
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.studentId, studentId));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async getAllStudents(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "student"));
  }
  
  // Question operations
  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }
  
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }
  
  async updateQuestion(id: number, questionData: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [updatedQuestion] = await db
      .update(questions)
      .set(questionData)
      .where(eq(questions.id, id))
      .returning();
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    const result = await db.delete(questions).where(eq(questions.id, id));
    return result.rowCount > 0;
  }
  
  async getAllQuestions(): Promise<Question[]> {
    return db.select().from(questions);
  }
  
  // Fisher-Yates algorithm for better randomization
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  // Randomize answer options while preserving correct answer
  private randomizeOptions(question: Question): Question {
    // For multiple-choice questions, randomize the options
    if (question.type === 'multiple-choice' && question.options) {
      // Keep track of the correct answer
      const correctAnswer = question.correctAnswer;
      
      // Shuffle the options
      const shuffledOptions = this.shuffleArray(question.options);
      
      // Return a new question with shuffled options
      return {
        ...question,
        options: shuffledOptions,
        correctAnswer
      };
    }
    
    // For other question types or if no options, return as is
    return question;
  }
  
  async getRandomQuestions(count: number): Promise<Question[]> {
    // For PostgreSQL we can use random() to get random questions
    const allQuestions = await db
      .select()
      .from(questions)
      .orderBy(sql`RANDOM()`)
      .limit(count);
    
    // Then randomize options for each question
    return allQuestions.map(q => this.randomizeOptions(q));
  }
  
  // Assessment operations
  async getAssessment(id: number): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
    return assessment;
  }
  
  async getAssessmentsByUser(userId: number): Promise<Assessment[]> {
    return db.select().from(assessments).where(eq(assessments.userId, userId));
  }
  
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [newAssessment] = await db
      .insert(assessments)
      .values({
        ...assessment,
        isComplete: false
      })
      .returning();
    return newAssessment;
  }
  
  async updateAssessment(id: number, data: Partial<Assessment>): Promise<Assessment | undefined> {
    const [updatedAssessment] = await db
      .update(assessments)
      .set(data)
      .where(eq(assessments.id, id))
      .returning();
    return updatedAssessment;
  }
  
  async getAllAssessments(): Promise<Assessment[]> {
    return db.select().from(assessments);
  }
  
  // Answer operations
  async getAnswer(id: number): Promise<Answer | undefined> {
    const [answer] = await db.select().from(answers).where(eq(answers.id, id));
    return answer;
  }
  
  async getAnswersByAssessment(assessmentId: number): Promise<Answer[]> {
    return db.select().from(answers).where(eq(answers.assessmentId, assessmentId));
  }
  
  async createAnswer(answer: InsertAnswer): Promise<Answer> {
    const [newAnswer] = await db.insert(answers).values(answer).returning();
    return newAnswer;
  }
  
  async updateAnswer(id: number, data: Partial<InsertAnswer>): Promise<Answer | undefined> {
    const [updatedAnswer] = await db
      .update(answers)
      .set(data)
      .where(eq(answers.id, id))
      .returning();
    return updatedAnswer;
  }
}

// Switch to database storage for persistence
export const storage = new DatabaseStorage();
