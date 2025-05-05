import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import QuestionRenderer from "@/components/QuestionRenderer";
import useTimer from "@/hooks/useTimer";
import { Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { Question, Answer } from "@shared/schema";

interface AssessmentResponse {
  assessmentId: number;
  questions?: Question[];
  isComplete?: boolean;
  timeRemaining?: number;
}

interface StudentAssessmentProps {
  onLogout: () => Promise<void>;
}

export default function Assessment({ onLogout }: StudentAssessmentProps) {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<Map<number, string>>(new Map());
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Start/resume assessment query
  const { 
    data: assessmentData,
    isLoading: isStartingAssessment,
    isError: startError,
    error: startErrorDetails,
    refetch: refetchAssessment
  } = useQuery<AssessmentResponse>({
    queryKey: ['/api/assessments/start'],
    queryFn: async (): Promise<AssessmentResponse> => {
      const response = await fetch('/api/assessments/start', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to start assessment: ' + await response.text());
      }
      return response.json();
    },
    enabled: true,
    retry: 1,
    staleTime: Infinity
  });

  // Set up timer
  const { 
    seconds: timeRemaining, 
    isRunning, 
    startTimer, 
    pauseTimer,
    updateTime
  } = useTimer(7200); // Default 2 hours

  // Format time as HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Initialize assessment data
  useEffect(() => {
    if (assessmentData) {
      setAssessmentId(assessmentData.assessmentId);
      setQuestions(assessmentData.questions || []);
      setIsCompleted(assessmentData.isComplete || false);
      
      if (assessmentData.timeRemaining) {
        updateTime(assessmentData.timeRemaining);
      }
      
      startTimer();
    }
  }, [assessmentData, startTimer, updateTime]);

  // Update timer on server periodically
  useEffect(() => {
    if (!assessmentId || !isRunning || isCompleted) return;

    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`/api/assessments/${assessmentId}/update-timer`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            timeRemaining
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to update timer: ${errorText}`);
          
          // If the assessment is marked as completed on the server, update local state
          if (errorText.includes("already completed")) {
            setIsCompleted(true);
          }
        }
      } catch (error) {
        console.error("Failed to update timer:", error);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(intervalId);
  }, [assessmentId, timeRemaining, isRunning, isCompleted]);

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number, answer: string }) => {
      if (!assessmentId) {
        throw new Error('No active assessment');
      }
      
      const response = await fetch(`/api/assessments/${assessmentId}/submit-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          assessmentId,
          questionId,
          answer
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit answer: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Answer submitted",
        description: `${data.answeredQuestions} of ${data.totalQuestions} questions answered`,
      });

      if (data.score !== undefined) {
        setIsCompleted(true);
        setScore(data.score);
        pauseTimer();
        toast({
          title: "Assessment completed!",
          description: `Your score: ${data.score}%`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to submit answer",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  });

  // Complete assessment (when time runs out or manually submitted)
  const completeAssessmentMutation = useMutation<any, Error, boolean>({
    mutationFn: async (isManual) => {
      if (!assessmentId) {
        throw new Error('No active assessment');
      }
      
      const response = await fetch(`/api/assessments/${assessmentId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          timeRemaining: isManual ? timeRemaining : 0
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to complete assessment: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      const isManual = variables; // The variable we passed in
      setIsCompleted(true);
      setScore(data.score);
      
      toast({
        title: isManual ? "Assessment Completed!" : "Time's up!",
        description: isManual 
          ? `Your score: ${data.score}%. Results have been recorded.` 
          : "Your assessment has been submitted",
        variant: isManual ? "default" : "destructive",
      });
    }
  });

  // Handle time up
  useEffect(() => {
    if (timeRemaining <= 0 && !isCompleted) {
      pauseTimer();
      completeAssessmentMutation.mutate(false);
    }
  }, [timeRemaining, isCompleted, pauseTimer, completeAssessmentMutation]);
  
  // Handle manual assessment submission
  const handleSubmitAssessment = async () => {
    if (assessmentId && !isCompleted) {
      // Show confirmation dialog
      const confirmed = window.confirm(
        `Are you sure you want to submit your assessment? You have answered ${userAnswers.size} out of ${questions.length} questions.`
      );
      
      if (confirmed) {
        pauseTimer();
        completeAssessmentMutation.mutate(true);
      }
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId: number, answer: string) => {
    setUserAnswers(prev => {
      const updated = new Map(prev);
      updated.set(questionId, answer);
      return updated;
    });

    submitAnswerMutation.mutate({ questionId, answer });
  };

  // Navigation handlers
  const handlePrevQuestion = () => {
    setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1));
  };

  // Calculate progress
  const calculateProgress = () => {
    if (questions.length === 0) return 0;
    return Math.round((userAnswers.size / questions.length) * 100);
  };

  const handleLogout = async () => {
    if (assessmentId && !isCompleted) {
      // Save current timer before logging out
      try {
        const response = await fetch(`/api/assessments/${assessmentId}/update-timer`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            timeRemaining
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to update timer before logout:', errorText);
        }
      } catch (error) {
        console.error('Error saving timer before logout:', error);
      }
    }
    
    await onLogout();
  };

  // Show loading state
  if (isStartingAssessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (startError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Assessment</h2>
          <p className="text-gray-600 mb-6">
            {startErrorDetails instanceof Error ? startErrorDetails.message : "Failed to load the assessment. Please try again."}
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Assessment completed state
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-white border-b border-neutral-200 py-4 px-6 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-neutral-800">Assessment Complete</h1>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </header>

        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-10 text-center">
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">
              You have completed the assessment!
            </h2>
            
            {score !== null && (
              <div className="mb-6">
                <div className="text-5xl font-bold text-primary mb-2">{score}%</div>
                <p className="text-neutral-600">Your final score</p>
              </div>
            )}
            
            <p className="text-neutral-600 mb-8">
              Thank you for completing the Computer Science assessment. Your results have been recorded.
            </p>
            
            <Button onClick={handleLogout}>
              Return to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Regular assessment view
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-neutral-200 py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-neutral-800">Computer Science Assessment</h1>
        <div className="flex items-center">
          <div className="mr-6 bg-yellow-100 text-yellow-800 py-1 px-3 rounded-md flex items-center">
            <Clock className="h-5 w-5 mr-1" />
            <span className="font-medium">{formatTime(timeRemaining)}</span>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        {currentQuestion ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-neutral-800">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </h2>
                <p className="text-neutral-600 mt-1">
                  Category: {currentQuestion.category}
                </p>
              </div>
              <div className="bg-neutral-100 rounded-full px-3 py-1">
                <span className="text-neutral-600 text-sm font-medium">
                  {calculateProgress()}% Complete
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <QuestionRenderer
                question={currentQuestion}
                selectedAnswer={userAnswers.get(currentQuestion.id)}
                onSelectAnswer={(answer) => handleAnswerSelect(currentQuestion.id, answer)}
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center"
                >
                  <ArrowLeft className="h-5 w-5 mr-1" />
                  Previous
                </Button>
                <Button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="flex items-center"
                >
                  Next
                  <ArrowRight className="h-5 w-5 ml-1" />
                </Button>
              </div>
              
              {userAnswers.size >= 3 && (
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="default" 
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
                    onClick={handleSubmitAssessment}
                  >
                    Submit Assessment
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h3 className="text-xl font-medium text-neutral-800 mb-4">No questions available</h3>
            <p className="text-neutral-600 mb-6">
              There are no questions available for this assessment.
            </p>
            <Button onClick={handleLogout}>
              Return to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}