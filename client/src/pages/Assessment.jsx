var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import QuestionRenderer from "@/components/QuestionRenderer";
import useTimer from "@/hooks/useTimer";
import { Clock, ArrowLeft, ArrowRight } from "lucide-react";
import BackButton from "@/components/BackButton";
export default function Assessment(_a) {
    var _this = this;
    var onLogout = _a.onLogout;
    var toast = useToast().toast;
    var _b = useState(0), currentQuestionIndex = _b[0], setCurrentQuestionIndex = _b[1];
    var _c = useState(null), assessmentId = _c[0], setAssessmentId = _c[1];
    var _d = useState(new Map()), userAnswers = _d[0], setUserAnswers = _d[1];
    var _e = useState([]), questions = _e[0], setQuestions = _e[1];
    var _f = useState(false), isCompleted = _f[0], setIsCompleted = _f[1];
    var _g = useState(null), score = _g[0], setScore = _g[1];
    // Start/resume assessment query
    var _h = useQuery({
        queryKey: ['/api/assessments/start'],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var response, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, fetch('/api/assessments/start', {
                            method: 'POST',
                            credentials: 'include'
                        })];
                    case 1:
                        response = _c.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        _a = Error.bind;
                        _b = 'Failed to start assessment: ';
                        return [4 /*yield*/, response.text()];
                    case 2: throw new (_a.apply(Error, [void 0, _b + (_c.sent())]))();
                    case 3: return [2 /*return*/, response.json()];
                }
            });
        }); },
        enabled: true,
        retry: 1,
        staleTime: Infinity
    }), assessmentData = _h.data, isStartingAssessment = _h.isLoading, startError = _h.isError, startErrorDetails = _h.error, refetchAssessment = _h.refetch;
    // Set up timer with persistence
    var handleTimerUpdate = useCallback(function (seconds) {
        if (assessmentId && !isCompleted) {
            // Persist timer to server
            fetch("/api/assessments/".concat(assessmentId, "/update-timer"), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    timeRemaining: seconds
                })
            })
                .then(function (response) {
                // If we get a 403 Not authorized error, the ID might be wrong - we need to refresh
                if (response.status === 403) {
                    console.warn("Assessment ID might be incorrect, consider refreshing");
                    // We don't want to interrupt the user constantly, so just log a warning for now
                    // If they try to submit an answer, they'll get the refresh button
                }
                return response;
            })
                .catch(function (error) {
                console.error("Failed to persist timer:", error);
            });
        }
    }, [assessmentId, isCompleted]);
    var _j = useTimer(7200, handleTimerUpdate), timeRemaining = _j.seconds, isRunning = _j.isRunning, startTimer = _j.startTimer, pauseTimer = _j.pauseTimer, updateTime = _j.updateTime; // Default 2 hours with auto-persist callback
    // Format time as HH:MM:SS
    var formatTime = function (totalSeconds) {
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = totalSeconds % 60;
        return "".concat(hours.toString().padStart(2, '0'), ":").concat(minutes.toString().padStart(2, '0'), ":").concat(seconds.toString().padStart(2, '0'));
    };
    // Initialize assessment data
    useEffect(function () {
        if (assessmentData) {
            // Check if user is restricted from taking assessment
            if (assessmentData.isRestricted) {
                // This will be handled in the render method
                return;
            }
            setAssessmentId(assessmentData.assessmentId);
            setQuestions(assessmentData.questions || []);
            setIsCompleted(assessmentData.isComplete || false);
            // Initialize user answers from existing studentAnswers in the questions
            var initialAnswers_1 = new Map();
            if (assessmentData.questions) {
                assessmentData.questions.forEach(function (question) {
                    if (question.studentAnswer) {
                        // In MongoDB, question.id is always a string
                        initialAnswers_1.set(question.id, question.studentAnswer);
                    }
                });
            }
            setUserAnswers(initialAnswers_1);
            // Initialize the timer with remaining time from the server
            if (assessmentData.timeRemaining !== undefined) {
                console.log("Setting timer to", assessmentData.timeRemaining, "seconds");
                updateTime(assessmentData.timeRemaining);
                // Only start if it's not already complete
                if (!assessmentData.isComplete) {
                    // Short delay to ensure the time is set before starting
                    setTimeout(function () {
                        startTimer();
                        console.log("Timer started with", assessmentData.timeRemaining, "seconds");
                    }, 100);
                }
            }
            else {
                console.warn("No time remaining data received from server");
            }
        }
    }, [assessmentData, startTimer, updateTime]);
    // Update check for assessment completion status
    useEffect(function () {
        if (!assessmentId || !isRunning || isCompleted)
            return;
        // This effect now just checks if the assessment is marked as complete on the server
        // Timer updates are handled by the handleTimerUpdate callback
        var checkCompletionStatus = function () { return __awaiter(_this, void 0, void 0, function () {
            var response, assessment, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fetch("/api/assessments/".concat(assessmentId), {
                                method: 'GET',
                                credentials: 'include'
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        assessment = _a.sent();
                        if (assessment.isComplete) {
                            setIsCompleted(true);
                            pauseTimer();
                            if (assessment.score !== undefined) {
                                setScore(assessment.score);
                            }
                        }
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        console.error("Failed to check assessment status:", error_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        // Check once when component mounts
        checkCompletionStatus();
    }, [assessmentId, isRunning, isCompleted, pauseTimer]);
    // Submit answer mutation
    var submitAnswerMutation = useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var questionIdStr, response, errorMessage, errorData, e_1;
            var questionId = _b.questionId, answer = _b.answer;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!assessmentId) {
                            throw new Error('No active assessment');
                        }
                        questionIdStr = typeof questionId === 'number' ? questionId.toString() : questionId;
                        return [4 /*yield*/, fetch("/api/assessments/".concat(assessmentId, "/submit-answer"), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                credentials: 'include',
                                body: JSON.stringify({
                                    assessmentId: assessmentId,
                                    questionId: questionIdStr,
                                    answer: answer
                                })
                            })];
                    case 1:
                        response = _c.sent();
                        if (!!response.ok) return [3 /*break*/, 7];
                        errorMessage = void 0;
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 6]);
                        return [4 /*yield*/, response.json()];
                    case 3:
                        errorData = _c.sent();
                        errorMessage = errorData.message || 'Unknown error occurred';
                        return [3 /*break*/, 6];
                    case 4:
                        e_1 = _c.sent();
                        return [4 /*yield*/, response.text()];
                    case 5:
                        // If we can't parse the JSON, just use the response text
                        errorMessage = _c.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        // Check if this is an authorization error and handle it gracefully
                        if (response.status === 403 && errorMessage.includes('Not authorized')) {
                            // Refetch the assessment to get the current user's own assessment ID
                            throw new Error('Authorization error. Please refresh the page to continue with your assessment.');
                        }
                        else {
                            throw new Error("Failed to submit answer: ".concat(errorMessage));
                        }
                        _c.label = 7;
                    case 7: return [2 /*return*/, response.json()];
                }
            });
        }); },
        onSuccess: function (data) {
            toast({
                title: "Answer submitted",
                description: "".concat(data.answeredQuestions, " of ").concat(data.totalQuestions, " questions answered"),
            });
            if (data.score !== undefined) {
                setIsCompleted(true);
                setScore(data.score);
                pauseTimer();
                toast({
                    title: "Assessment completed!",
                    description: "Your score: ".concat(data.score, "%"),
                });
            }
        },
        onError: function (error) {
            // If error suggests refreshing, offer a button to do so
            if (error instanceof Error && error.message.includes('refresh the page')) {
                toast({
                    title: "Assessment needs refresh",
                    description: (<div className="flex flex-col gap-2">
              <span>{error.message}</span>
              <Button variant="outline" onClick={function () { return refetchAssessment(); }} className="mt-2">
                Refresh Assessment
              </Button>
            </div>),
                    variant: "destructive",
                    duration: 10000, // Extra time to read and click
                });
            }
            else {
                toast({
                    title: "Failed to submit answer",
                    description: error instanceof Error ? error.message : "Please try again",
                    variant: "destructive",
                });
            }
        }
    });
    // Complete assessment (when time runs out or manually submitted)
    var completeAssessmentMutation = useMutation({
        mutationFn: function (isManual) { return __awaiter(_this, void 0, void 0, function () {
            var response, errorText;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!assessmentId) {
                            throw new Error('No active assessment');
                        }
                        return [4 /*yield*/, fetch("/api/assessments/".concat(assessmentId, "/complete"), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                credentials: 'include',
                                body: JSON.stringify({
                                    timeRemaining: isManual ? timeRemaining : 0
                                })
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        errorText = _a.sent();
                        throw new Error("Failed to complete assessment: ".concat(errorText));
                    case 3: return [2 /*return*/, response.json()];
                }
            });
        }); },
        onSuccess: function (data, variables) {
            var isManual = variables; // The variable we passed in
            setIsCompleted(true);
            setScore(data.score);
            toast({
                title: isManual ? "Assessment Completed!" : "Time's up!",
                description: isManual
                    ? "Your score: ".concat(data.score, "%. Results have been recorded.")
                    : "Your assessment has been submitted",
                variant: isManual ? "default" : "destructive",
            });
        }
    });
    // Handle time up
    useEffect(function () {
        if (timeRemaining <= 0 && !isCompleted) {
            pauseTimer();
            completeAssessmentMutation.mutate(false);
        }
    }, [timeRemaining, isCompleted, pauseTimer, completeAssessmentMutation]);
    // Handle manual assessment submission
    var handleSubmitAssessment = function () { return __awaiter(_this, void 0, void 0, function () {
        var confirmed;
        return __generator(this, function (_a) {
            if (assessmentId && !isCompleted) {
                confirmed = window.confirm("Are you sure you want to submit your assessment? You have answered ".concat(userAnswers.size, " out of ").concat(questions.length, " questions."));
                if (confirmed) {
                    pauseTimer();
                    completeAssessmentMutation.mutate(true);
                }
            }
            return [2 /*return*/];
        });
    }); };
    // Handle answer selection
    var handleAnswerSelect = function (questionId, answer) {
        // Convert questionId to string for MongoDB compatibility
        var questionIdStr = typeof questionId === 'number' ? questionId.toString() : questionId;
        setUserAnswers(function (prev) {
            var updated = new Map(prev);
            updated.set(questionIdStr, answer);
            return updated;
        });
        submitAnswerMutation.mutate({ questionId: questionIdStr, answer: answer });
    };
    // Handle clearing an answer
    var handleClearAnswer = function (questionId) {
        // Convert questionId to string for MongoDB compatibility
        var questionIdStr = typeof questionId === 'number' ? questionId.toString() : questionId;
        setUserAnswers(function (prev) {
            var updated = new Map(prev);
            updated.delete(questionIdStr);
            return updated;
        });
        // Submit empty string to clear the answer on the server
        submitAnswerMutation.mutate({ questionId: questionIdStr, answer: "" });
        toast({
            title: "Response Cleared",
            description: "Your answer has been cleared",
        });
    };
    // Navigation handlers
    var handlePrevQuestion = function () {
        setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
    };
    var handleNextQuestion = function () {
        setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1));
    };
    // Calculate progress
    var calculateProgress = function () {
        if (questions.length === 0)
            return 0;
        return Math.round((userAnswers.size / questions.length) * 100);
    };
    var handleLogout = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, errorData, e_2, errorText, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(assessmentId && !isCompleted)) return [3 /*break*/, 9];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    return [4 /*yield*/, fetch("/api/assessments/".concat(assessmentId, "/update-timer"), {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                                timeRemaining: timeRemaining
                            })
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 7];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 7]);
                    return [4 /*yield*/, response.json()];
                case 4:
                    errorData = _a.sent();
                    console.error('Failed to update timer before logout:', errorData);
                    return [3 /*break*/, 7];
                case 5:
                    e_2 = _a.sent();
                    return [4 /*yield*/, response.text()];
                case 6:
                    errorText = _a.sent();
                    console.error('Failed to update timer before logout:', errorText);
                    return [3 /*break*/, 7];
                case 7: return [3 /*break*/, 9];
                case 8:
                    error_2 = _a.sent();
                    console.error('Error saving timer before logout:', error_2);
                    return [3 /*break*/, 9];
                case 9: 
                // Proceed with logout regardless of timer update success
                return [4 /*yield*/, onLogout()];
                case 10:
                    // Proceed with logout regardless of timer update success
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    // Show loading state
    if (isStartingAssessment) {
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium">Loading assessment...</p>
        </div>
      </div>);
    }
    // Error state
    if (startError) {
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Assessment</h2>
          <p className="text-gray-600 mb-6">
            {startErrorDetails instanceof Error ? startErrorDetails.message : "Failed to load the assessment. Please try again."}
          </p>
          <Button onClick={function () { return window.location.reload(); }}>
            Try Again
          </Button>
        </div>
      </div>);
    }
    // Restricted assessment state (when student has already completed an assessment recently)
    if (assessmentData === null || assessmentData === void 0 ? void 0 : assessmentData.isRestricted) {
        return (<div className="min-h-screen bg-background">
        <header className="bg-white border-b border-neutral-200 py-4 px-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <BackButton to="/"/>
            <h1 className="text-xl font-semibold text-neutral-800">Assessment Restricted</h1>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </header>
        
        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-10 text-center">
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">
              You've recently completed an assessment
            </h2>
            
            <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6 inline-flex items-center flex-col">
              <Clock className="h-12 w-12 text-yellow-600 mb-4"/>
              <p className="text-yellow-800 text-lg font-medium mb-2">
                Please wait before starting a new assessment
              </p>
              <p className="text-yellow-700">
                {assessmentData.message || "You need to wait before taking another assessment"}
              </p>
              {assessmentData.waitTime && (<div className="mt-4 bg-white rounded-full px-6 py-3 border border-yellow-200">
                  <span className="font-bold">
                    {assessmentData.waitTime.hours} hours and {assessmentData.waitTime.minutes} minutes remaining
                  </span>
                </div>)}
            </div>
            
            <p className="text-neutral-600 mb-6">
              This restriction is in place to maintain the integrity of the assessment process.
            </p>
            
            <Button onClick={handleLogout} className="px-8">
              Return to Login
            </Button>
          </div>
        </div>
      </div>);
    }
    // Assessment completed state
    if (isCompleted) {
        return (<div className="min-h-screen bg-background">
        <header className="bg-white border-b border-neutral-200 py-4 px-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <BackButton to="/"/>
            <h1 className="text-xl font-semibold text-neutral-800">Assessment Complete</h1>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </header>

        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-10 text-center">
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">
              You have completed the assessment!
            </h2>
            
            {score !== null && (<div className="mb-6">
                <div className="text-5xl font-bold text-primary mb-2">{score}%</div>
                <p className="text-neutral-600">Your final score</p>
              </div>)}
            
            <p className="text-neutral-600 mb-8">
              Thank you for completing the assessment. Your results have been recorded.
            </p>
            
            <Button onClick={handleLogout}>
              Return to Login
            </Button>
          </div>
        </div>
      </div>);
    }
    // Regular assessment view
    var currentQuestion = questions[currentQuestionIndex];
    return (<div className="min-h-screen bg-background">
      <header className="bg-white border-b border-neutral-200 py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <BackButton to="/"/>
          <h1 className="text-xl font-semibold text-neutral-800">Hemraj Assesment Platform</h1>
          <Button variant="outline" size="sm" onClick={function () {
            var confirmed = window.confirm("This will refresh your assessment. Any unsaved progress may be lost. Continue?");
            if (confirmed) {
                refetchAssessment();
            }
        }} className="text-xs">
            Refresh Assessment
          </Button>
        </div>
        <div className="flex items-center">
          <div className="mr-6 bg-yellow-100 text-yellow-800 py-1 px-3 rounded-md flex items-center">
            <Clock className="h-5 w-5 mr-1"/>
            <span className="font-medium">{formatTime(timeRemaining)}</span>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        {currentQuestion ? (<>
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
              <QuestionRenderer question={currentQuestion} selectedAnswer={userAnswers.get(currentQuestion.id)} onSelectAnswer={function (answer) { return handleAnswerSelect(currentQuestion.id, answer); }} onClearAnswer={function () { return handleClearAnswer(currentQuestion.id); }}/>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0} className="flex items-center">
                  <ArrowLeft className="h-5 w-5 mr-1"/>
                  Previous
                </Button>
                <Button onClick={handleNextQuestion} disabled={currentQuestionIndex === questions.length - 1} className="flex items-center">
                  Next
                  <ArrowRight className="h-5 w-5 ml-1"/>
                </Button>
              </div>
              
              {userAnswers.size >= 3 && (<div className="flex justify-center mt-4">
                  <Button variant="default" size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-2" onClick={handleSubmitAssessment}>
                    Submit Assessment
                  </Button>
                </div>)}
            </div>
          </>) : (<div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h3 className="text-xl font-medium text-neutral-800 mb-4">No questions available</h3>
            <p className="text-neutral-600 mb-6">
              There are no questions available for this assessment.
            </p>
            <Button onClick={handleLogout}>
              Return to Login
            </Button>
          </div>)}
      </div>
    </div>);
}
