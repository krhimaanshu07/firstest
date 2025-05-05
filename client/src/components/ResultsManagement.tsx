import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Assessment } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface EnhancedAssessment extends Assessment {
  student?: {
    id: number;
    username: string;
    studentId?: string;
  };
  answeredQuestions: number;
  correctAnswers: number;
}

export default function ResultsManagement() {
  const { toast } = useToast();
  
  // Fetch assessment results
  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['/api/assessments'],
    onError: (error) => {
      toast({
        title: "Failed to load results",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Filter to only completed assessments
  const completedAssessments = assessments.filter((assessment: EnhancedAssessment) => assessment.isComplete);
  
  // Format time spent (in seconds) to HH:MM:SS
  const formatTimeSpent = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Assessment Results</h2>
        <p className="text-neutral-600 mt-1">View student performance and assessment results</p>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-100">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Assessment ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Student</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Score</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Questions</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Time Spent</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Completion Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                </td>
              </tr>
            ) : completedAssessments.length > 0 ? (
              completedAssessments.map((assessment: EnhancedAssessment, index: number) => (
                <tr key={assessment.id} className={index % 2 === 1 ? "bg-neutral-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {assessment.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {assessment.student?.username || "Unknown"} 
                    {assessment.student?.studentId ? ` (${assessment.student.studentId})` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      (assessment.score || 0) >= 80
                        ? "bg-green-100 text-green-800"
                        : (assessment.score || 0) >= 60
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
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
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-neutral-500">
                  No assessment results available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
