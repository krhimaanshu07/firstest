import { useState, FC } from "react";
import { Question } from "@shared/schema";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface QuestionRendererProps {
  question: Question;
  selectedAnswer?: string;
  onSelectAnswer: (answer: string) => void;
}

const QuestionRenderer: FC<QuestionRendererProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
}) => {
  const [codeAnswer, setCodeAnswer] = useState(selectedAnswer || "");

  const handleSubmitCode = () => {
    onSelectAnswer(codeAnswer);
  };

  if (question.type === "multiple-choice") {
    return (
      <div>
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">
          {question.content}
        </h3>

        <RadioGroup
          value={selectedAnswer}
          onValueChange={onSelectAnswer}
          className="space-y-3 mb-6"
        >
          {question.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`q-option-${index}`} />
              <Label htmlFor={`q-option-${index}`} className="text-neutral-700">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  } else if (question.type === "code") {
    return (
      <div>
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">
          {question.content}
        </h3>

        <Textarea
          value={codeAnswer}
          onChange={(e) => setCodeAnswer(e.target.value)}
          placeholder="Write your code here..."
          rows={10}
          className="font-mono mb-4"
        />

        <Button onClick={handleSubmitCode} className="w-full">
          Submit Code
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-yellow-100 rounded-md">
      <p>Unknown question type: {question.type}</p>
    </div>
  );
};

export default QuestionRenderer;
