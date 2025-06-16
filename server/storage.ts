import session from "express-session";
import { User, Question, Assessment, Answer, IUser, IQuestion, IAssessment, IAnswer } from "./models.js";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";

// Define types that match our Mongoose models but usable in the rest of the application
export type User = Omit<IUser, keyof mongoose.Document> & { id: string };
export type Question = Omit<IQuestion, keyof mongoose.Document> & { id: string };
export type Assessment = Omit<IAssessment, keyof mongoose.Document> & { id: string };
export type Answer = Omit<IAnswer, keyof mongoose.Document> & { id: string };

// For the insert types, we use simplified versions that don't include the id
export type InsertUser = Pick<User, "username" | "password" | "role" | "email" | "studentId">;
export type InsertQuestion = Pick<Question, "title" | "content" | "type" | "category" | "difficulty" | "options" | "correctAnswer">;
export type InsertAssessment = Pick<Assessment, "userId" | "startTime" | "timeRemaining">;
export type InsertAnswer = Pick<Answer, "assessmentId" | "questionId" | "answer" | "isCorrect">;

export interface IStorage {
  // User operations
  getUser(id: string | number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByStudentId(studentId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: string | number): Promise<boolean>;
  getAllStudents(): Promise<User[]>;
  
  // Question operations
  getQuestion(id: string | number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string | number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: string | number): Promise<boolean>;
  getAllQuestions(): Promise<Question[]>;
  getRandomQuestions(count: number): Promise<Question[]>;
  
  // Assessment operations
  getAssessment(id: string | number): Promise<Assessment | undefined>;
  getAssessmentsByUser(userId: string | number): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: string | number, data: Partial<Assessment>): Promise<Assessment | undefined>;
  deleteAssessment(id: string | number): Promise<boolean>;
  getAllAssessments(): Promise<Assessment[]>;
  
  // Answer operations
  getAnswer(id: string | number): Promise<Answer | undefined>;
  getAnswersByAssessment(assessmentId: string | number): Promise<Answer[]>;
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  updateAnswer(id: string | number, data: Partial<InsertAnswer>): Promise<Answer | undefined>;
  deleteAnswer(id: string | number): Promise<boolean>;
  
  // Session store for authentication
  sessionStore: session.Store;
  
  // MongoDB specific - initialize session store with established client
  initSessionStore?(client: any): void;
}

export class MongoDBStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    // Initialize MongoDB session store
    this.sessionStore = new MongoStore({
      mongoUrl: process.env.MONGO_DB || 'mongodb+srv://vermaravifzd022:10EULEvReB6fdhyW@cluster0.g2bvjbh.mongodb.net/assessment?retryWrites=true&w=majority&appName=Cluster0',
      collectionName: 'sessions',
      ttl: 7 * 24 * 60 * 60 // 1 week
    });
  }

  public initSessionStore(client: any) {
    this.sessionStore = new MongoStore({
      clientPromise: Promise.resolve(client),
      collectionName: 'sessions',
      ttl: 7 * 24 * 60 * 60 // 1 week
    });
  }

  private documentToObject<T extends mongoose.Document>(doc: T | null): any {
    if (!doc) return null;
    const obj = doc.toObject();
    obj.id = obj._id.toString();
    delete obj._id;
    delete obj.__v;
    return obj;
  }

  async getUser(id: string | number): Promise<User | undefined> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid user ID format:', id);
        return undefined;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const user = await User.findById(idStr);
        return this.documentToObject(user);
      } else {
        console.warn(`Non-ObjectId format ID for user: ${idStr}`);
        return undefined;
      }
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await User.findOne({ username });
      return this.documentToObject(user);
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    try {
      const user = await User.findOne({ studentId });
      return this.documentToObject(user);
    } catch (error) {
      console.error('Error getting user by student ID:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const newUser = new User(user);
      await newUser.save();
      return this.documentToObject(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string | number): Promise<boolean> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid user ID format for delete:', id);
        return false;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const result = await User.findByIdAndDelete(idStr);
        return !!result;
      } else {
        console.warn(`Non-ObjectId format ID for user delete: ${idStr}`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async getAllStudents(): Promise<User[]> {
    try {
      const students = await User.find({ role: 'student' });
      return students.map((student: mongoose.Document) => this.documentToObject(student));
    } catch (error) {
      console.error('Error getting all students:', error);
      return [];
    }
  }

  async getQuestion(id: string | number): Promise<Question | undefined> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid question ID format:', id);
        return undefined;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const question = await Question.findById(idStr);
        return this.documentToObject(question);
      } else {
        console.warn(`Non-ObjectId format ID for question: ${idStr}`);
        return undefined;
      }
    } catch (error) {
      console.error('Error getting question:', error);
      return undefined;
    }
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    try {
      const newQuestion = new Question(question);
      await newQuestion.save();
      return this.documentToObject(newQuestion);
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  }

  async updateQuestion(id: string | number, questionData: Partial<InsertQuestion>): Promise<Question | undefined> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid question ID format for update:', id);
        return undefined;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const updatedQuestion = await Question.findByIdAndUpdate(
          idStr,
          { $set: questionData },
          { new: true }
        );
        return this.documentToObject(updatedQuestion);
      } else {
        console.warn(`Non-ObjectId format ID for question update: ${idStr}`);
        return undefined;
      }
    } catch (error) {
      console.error('Error updating question:', error);
      return undefined;
    }
  }

  async deleteQuestion(id: string | number): Promise<boolean> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid question ID format for delete:', id);
        return false;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const result = await Question.findByIdAndDelete(idStr);
        return !!result;
      } else {
        console.warn(`Non-ObjectId format ID for question delete: ${idStr}`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      return false;
    }
  }

  async getAllQuestions(): Promise<Question[]> {
    try {
      const questions = await Question.find();
      return questions.map((question: mongoose.Document) => this.documentToObject(question));
    } catch (error) {
      console.error('Error getting all questions:', error);
      return [];
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

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
    try {
      const allQuestions = await Question.find();
      
      // First, randomize the order of questions
      const shuffledQuestions = this.shuffleArray(allQuestions);
      
      // Take the first 'count' questions
      const selectedQuestions = shuffledQuestions.slice(0, count);
      
      // Convert to objects first, then randomize options
      const questionObjects = selectedQuestions.map((question: mongoose.Document) => this.documentToObject(question));
      
      // Randomize options for each question
      const randomizedQuestions = questionObjects.map(question => this.randomizeOptions(question));
      
      return randomizedQuestions;
    } catch (error) {
      console.error('Error getting random questions:', error);
      return [];
    }
  }

  async getAssessment(id: string | number): Promise<Assessment | undefined> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid assessment ID format:', id);
        return undefined;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const assessment = await Assessment.findById(idStr).populate('userId');
        return this.documentToObject(assessment);
      } else {
        console.warn(`Non-ObjectId format ID for assessment: ${idStr}`);
        return undefined;
      }
    } catch (error) {
      console.error('Error getting assessment:', error);
      return undefined;
    }
  }

  async getAssessmentsByUser(userId: string | number): Promise<Assessment[]> {
    try {
      const userIdStr = typeof userId === 'number' ? String(userId) : userId;
      const assessments = await Assessment.find({ userId: userIdStr });
      return assessments.map((assessment: mongoose.Document) => this.documentToObject(assessment));
    } catch (error) {
      console.error('Error getting assessments by user:', error);
      return [];
    }
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    try {
      const newAssessment = new Assessment({
        ...assessment,
        isComplete: false
      });
      await newAssessment.save();
      return this.documentToObject(newAssessment);
    } catch (error) {
      console.error('Error creating assessment:', error);
      throw error;
    }
  }

  async updateAssessment(id: string | number, data: Partial<Assessment>): Promise<Assessment | undefined> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid assessment ID format for update:', id);
        return undefined;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const updatedAssessment = await Assessment.findByIdAndUpdate(
          idStr,
          { $set: data },
          { new: true }
        );
        return this.documentToObject(updatedAssessment);
      } else {
        console.warn(`Non-ObjectId format ID for assessment update: ${idStr}`);
        return undefined;
      }
    } catch (error) {
      console.error('Error updating assessment:', error);
      return undefined;
    }
  }

  async getAllAssessments(): Promise<Assessment[]> {
    try {
      const assessments = await Assessment.find().populate('userId');
      return assessments.map((assessment: mongoose.Document) => this.documentToObject(assessment));
    } catch (error) {
      console.error('Error getting all assessments:', error);
      return [];
    }
  }

  async deleteAssessment(id: string | number): Promise<boolean> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid assessment ID format for delete:', id);
        return false;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const result = await Assessment.findByIdAndDelete(idStr);
        return !!result;
      } else {
        console.warn(`Non-ObjectId format ID for assessment delete: ${idStr}`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting assessment:', error);
      return false;
    }
  }

  async getAnswer(id: string | number): Promise<Answer | undefined> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid answer ID format:', id);
        return undefined;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const answer = await Answer.findById(idStr);
        return this.documentToObject(answer);
      } else {
        console.warn(`Non-ObjectId format ID for answer: ${idStr}`);
        return undefined;
      }
    } catch (error) {
      console.error('Error getting answer:', error);
      return undefined;
    }
  }

  async getAnswersByAssessment(assessmentId: string | number): Promise<Answer[]> {
    try {
      const assessmentIdStr = typeof assessmentId === 'number' ? String(assessmentId) : assessmentId;
      const answers = await Answer.find({ assessmentId: assessmentIdStr });
      return answers.map((answer: mongoose.Document) => this.documentToObject(answer));
    } catch (error) {
      console.error('Error getting answers by assessment:', error);
      return [];
    }
  }

  async createAnswer(answer: InsertAnswer): Promise<Answer> {
    try {
      const newAnswer = new Answer(answer);
      await newAnswer.save();
      return this.documentToObject(newAnswer);
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }

  async updateAnswer(id: string | number, data: Partial<InsertAnswer>): Promise<Answer | undefined> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid answer ID format for update:', id);
        return undefined;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const updatedAnswer = await Answer.findByIdAndUpdate(
          idStr,
          { $set: data },
          { new: true }
        );
        return this.documentToObject(updatedAnswer);
      } else {
        console.warn(`Non-ObjectId format ID for answer update: ${idStr}`);
        return undefined;
      }
    } catch (error) {
      console.error('Error updating answer:', error);
      return undefined;
    }
  }

  async deleteAnswer(id: string | number): Promise<boolean> {
    try {
      // Handle invalid input
      if (!id || typeof id === 'object') {
        console.error('Invalid answer ID format for delete:', id);
        return false;
      }
      
      // Convert number to string if needed
      const idStr = typeof id === 'number' ? String(id) : id;
      
      // Check if the ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        const result = await Answer.findByIdAndDelete(idStr);
        return !!result;
      } else {
        console.warn(`Non-ObjectId format ID for answer delete: ${idStr}`);
        return false;
      }
    } catch (error) {
      console.error('Error deleting answer:', error);
      return false;
    }
  }
}

// Use MongoDB storage for persistence
export const storage = new MongoDBStorage();
