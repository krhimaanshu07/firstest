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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
export default function ResultsManagement() {
    var _this = this;
    var toast = useToast().toast;
    var queryClient = useQueryClient();
    var _a = useState(false), isDeleteDialogOpen = _a[0], setIsDeleteDialogOpen = _a[1];
    // Fetch assessment results
    var _b = useQuery({
        queryKey: ['/api/assessments']
    }), _c = _b.data, assessments = _c === void 0 ? [] : _c, isLoading = _b.isLoading;
    // Clear all results mutation
    var clearResultsMutation = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, apiRequest("DELETE", "/api/assessments").then(function (res) { return res.json(); })];
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
            setIsDeleteDialogOpen(false);
            toast({
                title: "Results cleared",
                description: "All assessment results have been cleared successfully",
            });
        },
        onError: function (error) {
            toast({
                title: "Failed to clear results",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive",
            });
        }
    });
    // Filter to only completed assessments
    var completedAssessments = assessments.filter(function (assessment) { return assessment.isComplete; });
    // Format time spent (in seconds) to HH:MM:SS
    var formatTimeSpent = function (startTime, endTime) {
        var start = startTime instanceof Date ? startTime : new Date(startTime);
        var end = endTime instanceof Date ? endTime : new Date(endTime);
        var diffSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
        var hours = Math.floor(diffSeconds / 3600);
        var minutes = Math.floor((diffSeconds % 3600) / 60);
        var seconds = diffSeconds % 60;
        return "".concat(hours.toString().padStart(2, '0'), ":").concat(minutes.toString().padStart(2, '0'), ":").concat(seconds.toString().padStart(2, '0'));
    };
    return (<>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-800">Assessment Results</h2>
            <p className="text-neutral-600 mt-1">View student performance and assessment results</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={function () {
            // Export to CSV
            var csv = __spreadArray([
                // Headers
                ['Student', 'Score', 'Questions', 'Time Spent', 'Completion Date'].join(',')
            ], completedAssessments.map(function (assessment) {
                var _a, _b;
                return [
                    "\"".concat(((_a = assessment.student) === null || _a === void 0 ? void 0 : _a.username) || 'Unknown').concat(((_b = assessment.student) === null || _b === void 0 ? void 0 : _b.studentId) ? " (".concat(assessment.student.studentId, ")") : '', "\""),
                    "".concat(assessment.score || 0, "%"),
                    "".concat(assessment.correctAnswers || 0, "/").concat(assessment.answeredQuestions || 0),
                    "".concat(assessment.startTime && assessment.endTime ? formatTimeSpent(assessment.startTime, assessment.endTime) : 'N/A'),
                    "".concat(assessment.endTime ? format(new Date(assessment.endTime), 'MMM d, yyyy HH:mm') : 'N/A')
                ].join(',');
            }), true).join('\n');
            var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            var url = URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', "assessment-results-".concat(format(new Date(), 'yyyy-MM-dd'), ".csv"));
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }}>
              <FileDown className="h-5 w-5 mr-1"/>
              Export to CSV
            </Button>
            
            <Button variant="outline" onClick={function () { return setIsDeleteDialogOpen(true); }} disabled={completedAssessments.length === 0} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
              <Trash2 className="h-5 w-5 mr-1"/>
              Clear Results
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Student</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Score</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Questions</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Time Spent</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Completion Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {isLoading ? (<tr>
                  <td colSpan={5} className="px-6 py-10 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto"/>
                  </td>
                </tr>) : completedAssessments.length > 0 ? (completedAssessments.map(function (assessment, index) {
            var _a, _b;
            return (<tr key={assessment.id} className={index % 2 === 1 ? "bg-neutral-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {((_a = assessment.student) === null || _a === void 0 ? void 0 : _a.username) || "Unknown"} 
                      {((_b = assessment.student) === null || _b === void 0 ? void 0 : _b.studentId) ? " (".concat(assessment.student.studentId, ")") : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={"px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ".concat((assessment.score || 0) >= 80
                    ? "bg-green-100 text-green-800"
                    : (assessment.score || 0) >= 60
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800")}>
                        {assessment.score || 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {assessment.correctAnswers || 0}/{assessment.answeredQuestions || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {assessment.startTime && assessment.endTime
                    ? formatTimeSpent(assessment.startTime, assessment.endTime)
                    : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {assessment.endTime
                    ? format(new Date(assessment.endTime), "MMM d, yyyy HH:mm")
                    : "N/A"}
                    </td>
                  </tr>);
        })) : (<tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-neutral-500">
                    No assessment results available yet.
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Results?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all assessment results from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={function () { return clearResultsMutation.mutate(); }} className="bg-red-600 hover:bg-red-700">
              {clearResultsMutation.isPending ? (<Loader2 className="h-4 w-4 animate-spin mr-2"/>) : null}
              Clear Results
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>);
}
