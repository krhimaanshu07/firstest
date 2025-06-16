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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import RegisterStudentForm from "./RegisterStudentForm";
import { format } from "date-fns";
export default function StudentManagement() {
    var _this = this;
    var toast = useToast().toast;
    var queryClient = useQueryClient();
    var _a = useState(false), isRegisterDialogOpen = _a[0], setIsRegisterDialogOpen = _a[1];
    var _b = useState(false), isDeleteDialogOpen = _b[0], setIsDeleteDialogOpen = _b[1];
    var _c = useState(null), currentStudent = _c[0], setCurrentStudent = _c[1];
    // Fetch students
    var _d = useQuery({
        queryKey: ['/api/students'],
    }), _e = _d.data, students = _e === void 0 ? [] : _e, isLoading = _d.isLoading;
    // Register student mutation
    var registerStudentMutation = useMutation({
        mutationFn: function (studentData) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiRequest("POST", "/api/students/register", studentData).then(function (res) { return res.json(); })];
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ['/api/students'] });
            setIsRegisterDialogOpen(false);
            toast({
                title: "Student registered",
                description: "The student has been registered successfully",
            });
        },
        onError: function (error) {
            toast({
                title: "Failed to register student",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive",
            });
        }
    });
    // Delete student mutation
    var deleteStudentMutation = useMutation({
        mutationFn: function (studentId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiRequest("DELETE", "/api/students/".concat(studentId)).then(function (res) { return res.json(); })];
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ['/api/students'] });
            setIsDeleteDialogOpen(false);
            setCurrentStudent(null);
            toast({
                title: "Student removed",
                description: "The student has been removed successfully",
            });
        },
        onError: function (error) {
            toast({
                title: "Failed to remove student",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive",
            });
        }
    });
    var handleRegisterStudent = function (studentData) {
        registerStudentMutation.mutate(studentData);
    };
    var handleDeleteClick = function (student) {
        setCurrentStudent(student);
        setIsDeleteDialogOpen(true);
    };
    return (<>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-800">Student Management</h2>
          <Button onClick={function () { return setIsRegisterDialogOpen(true); }}>
            <Plus className="h-5 w-5 mr-1"/>
            Register Student
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Student ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Username</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Registration Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {isLoading ? (<tr>
                  <td colSpan={5} className="px-6 py-10 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto"/>
                  </td>
                </tr>) : students.length > 0 ? (students.map(function (student, index) { return (<tr key={student.id} className={index % 2 === 1 ? "bg-neutral-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{student.studentId || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{student.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{student.email || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {student.registrationDate ? format(new Date(student.registrationDate), "MMM d, yyyy") : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                      <Button variant="ghost" size="sm" onClick={function () { return handleDeleteClick(student); }} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4"/>
                        <span className="ml-1">Remove</span>
                      </Button>
                    </td>
                  </tr>); })) : (<tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-neutral-500">
                    No students registered yet. Register your first student to get started.
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
        
        {/* Register Student Dialog */}
        <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Register New Student</DialogTitle>
              <DialogDescription>
                Create a new student account for the assessment platform
              </DialogDescription>
            </DialogHeader>
            <RegisterStudentForm onSubmit={handleRegisterStudent} onCancel={function () { return setIsRegisterDialogOpen(false); }} isSubmitting={registerStudentMutation.isPending}/>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Student Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the student
              {currentStudent ? " ".concat(currentStudent.username) : ''} and all their assessment data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={function () { return currentStudent && deleteStudentMutation.mutate(currentStudent.id); }} className="bg-red-600 hover:bg-red-700">
              {deleteStudentMutation.isPending ? (<Loader2 className="h-4 w-4 animate-spin mr-2"/>) : null}
              Remove Student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>);
}
