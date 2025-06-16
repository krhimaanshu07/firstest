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
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2, BookA } from "lucide-react";
import AddQuestionForm from "./AddQuestionForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
export default function QuestionManagement() {
    var _this = this;
    var toast = useToast().toast;
    var queryClient = useQueryClient();
    var _a = useState(false), isAddDialogOpen = _a[0], setIsAddDialogOpen = _a[1];
    var _b = useState(false), isEditDialogOpen = _b[0], setIsEditDialogOpen = _b[1];
    var _c = useState(false), isDeleteDialogOpen = _c[0], setIsDeleteDialogOpen = _c[1];
    var _d = useState(null), currentQuestion = _d[0], setCurrentQuestion = _d[1];
    // Fetch questions
    var _e = useQuery({
        queryKey: ['/api/questions'],
    }), _f = _e.data, questions = _f === void 0 ? [] : _f, isLoading = _e.isLoading;
    // Add question mutation
    var addQuestionMutation = useMutation({
        mutationFn: function (questionData) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiRequest("POST", "/api/questions", questionData).then(function (res) { return res.json(); })];
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
            setIsAddDialogOpen(false);
            toast({
                title: "Question added",
                description: "The question has been added successfully",
            });
        },
        onError: function (error) {
            toast({
                title: "Failed to add question",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive",
            });
        }
    });
    // Update question mutation
    var updateQuestionMutation = useMutation({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var id = _b.id, data = _b.data;
            return __generator(this, function (_c) {
                return [2 /*return*/, apiRequest("PUT", "/api/questions/".concat(id), data).then(function (res) { return res.json(); })];
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
            setIsEditDialogOpen(false);
            toast({
                title: "Question updated",
                description: "The question has been updated successfully",
            });
        },
        onError: function (error) {
            toast({
                title: "Failed to update question",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive",
            });
        }
    });
    // Delete question mutation
    var deleteQuestionMutation = useMutation({
        mutationFn: function (id) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiRequest("DELETE", "/api/questions/".concat(id))];
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
            setIsDeleteDialogOpen(false);
            toast({
                title: "Question deleted",
                description: "The question has been deleted successfully",
            });
        },
        onError: function (error) {
            toast({
                title: "Failed to delete question",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive",
            });
        }
    });
    // Add CS questions mutation
    var addCSQuestionsMutation = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiRequest("POST", "/api/questions/add-cs-questions").then(function (res) { return res.json(); })];
            });
        }); },
        onSuccess: function (data) {
            queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
            toast({
                title: "CS Questions Added",
                description: "Successfully added ".concat(data.count || 'multiple', " computer science questions to the database."),
            });
        },
        onError: function (error) {
            toast({
                title: "Failed to add CS questions",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive",
            });
        }
    });
    var handleAddQuestion = function (questionData) {
        addQuestionMutation.mutate(questionData);
    };
    var handleUpdateQuestion = function (questionData) {
        if (!currentQuestion)
            return;
        updateQuestionMutation.mutate({
            id: currentQuestion.id,
            data: questionData,
        });
    };
    var handleDeleteQuestion = function () {
        if (!currentQuestion)
            return;
        deleteQuestionMutation.mutate(currentQuestion.id);
    };
    return (<div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Question Management</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={function () { return addCSQuestionsMutation.mutate(); }} disabled={addCSQuestionsMutation.isPending}>
            {addCSQuestionsMutation.isPending ? (<Loader2 className="h-4 w-4 animate-spin mr-2"/>) : (<BookA className="h-5 w-5 mr-1"/>)}
            Add CS Questions
          </Button>
          <Button onClick={function () { return setIsAddDialogOpen(true); }}>
            <Plus className="h-5 w-5 mr-1"/>
            Add Question
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-100">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Title</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Category</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Difficulty</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {isLoading ? (<tr>
                <td colSpan={6} className="px-6 py-10 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto"/>
                </td>
              </tr>) : questions.length > 0 ? (questions.map(function (question, index) { return (<tr key={question.id} className={index % 2 === 1 ? "bg-neutral-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {question.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {question.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={"px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ".concat(question.type === "multiple-choice"
                ? "bg-blue-100 text-blue-800"
                : "bg-purple-100 text-purple-800")}>
                      {question.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {question.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={"px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ".concat(question.difficulty === "easy"
                ? "bg-green-100 text-green-800"
                : question.difficulty === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800")}>
                      {question.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button variant="ghost" size="sm" onClick={function () {
                setCurrentQuestion(question);
                setIsEditDialogOpen(true);
            }} className="text-blue-600 hover:text-blue-900 mr-2">
                      <Pencil className="h-5 w-5"/>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={function () {
                setCurrentQuestion(question);
                setIsDeleteDialogOpen(true);
            }} className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-5 w-5"/>
                    </Button>
                  </td>
                </tr>); })) : (<tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-neutral-500">
                  No questions available. Add your first question to get started.
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
      
      {/* Add Question Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
            <DialogDescription>
              Create a new question for the assessment
            </DialogDescription>
          </DialogHeader>
          <AddQuestionForm onSubmit={handleAddQuestion} onCancel={function () { return setIsAddDialogOpen(false); }} isSubmitting={addQuestionMutation.isPending}/>
        </DialogContent>
      </Dialog>
      
      {/* Edit Question Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Update question details
            </DialogDescription>
          </DialogHeader>
          {currentQuestion && (<AddQuestionForm initialData={currentQuestion} onSubmit={handleUpdateQuestion} onCancel={function () { return setIsEditDialogOpen(false); }} isSubmitting={updateQuestionMutation.isPending}/>)}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the question
              "{currentQuestion === null || currentQuestion === void 0 ? void 0 : currentQuestion.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuestion} className="bg-red-600 hover:bg-red-700">
              {deleteQuestionMutation.isPending ? (<Loader2 className="h-4 w-4 animate-spin mr-2"/>) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
}
