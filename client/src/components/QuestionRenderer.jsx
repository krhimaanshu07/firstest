import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
var QuestionRenderer = function (_a) {
    var _b;
    var question = _a.question, selectedAnswer = _a.selectedAnswer, onSelectAnswer = _a.onSelectAnswer, onClearAnswer = _a.onClearAnswer;
    var _c = useState(selectedAnswer || ""), codeAnswer = _c[0], setCodeAnswer = _c[1];
    var handleSubmitCode = function () {
        onSelectAnswer(codeAnswer);
    };
    var handleClearAnswer = function () {
        if (onClearAnswer) {
            onClearAnswer();
        }
        else if (question.type === "code") {
            setCodeAnswer("");
            onSelectAnswer("");
        }
    };
    if (question.type === "multiple-choice") {
        return (<div>
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">
          {question.content}
        </h3>

        <RadioGroup value={selectedAnswer} onValueChange={onSelectAnswer} className="space-y-3 mb-6">
          {(_b = question.options) === null || _b === void 0 ? void 0 : _b.map(function (option, index) { return (<div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={"q-option-".concat(index)}/>
              <Label htmlFor={"q-option-".concat(index)} className="text-neutral-700">
                {option}
              </Label>
            </div>); })}
        </RadioGroup>
        
        {selectedAnswer && (<Button onClick={handleClearAnswer} variant="outline" className="mt-2" size="sm">
            Clear Response
          </Button>)}
      </div>);
    }
    else if (question.type === "code") {
        return (<div>
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">
          {question.content}
        </h3>

        <Textarea value={codeAnswer} onChange={function (e) { return setCodeAnswer(e.target.value); }} placeholder="Write your code here..." rows={10} className="font-mono mb-4"/>

        <div className="flex flex-col gap-2">
          <Button onClick={handleSubmitCode} className="w-full">
            Submit Code
          </Button>
          
          {codeAnswer && (<Button onClick={handleClearAnswer} variant="outline" className="w-full" size="sm">
              Clear Response
            </Button>)}
        </div>
      </div>);
    }
    return (<div className="p-4 bg-yellow-100 rounded-md">
      <p>Unknown question type: {question.type}</p>
    </div>);
};
export default QuestionRenderer;
