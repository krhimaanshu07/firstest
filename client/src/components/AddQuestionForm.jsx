var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertQuestionSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
// Extend the schema for the form
var questionFormSchema = insertQuestionSchema.extend({
    options: z.array(z.string()).optional(), // Keep options optional for the form
    option1: z.string().min(1, "Option 1 is required").optional(),
    option2: z.string().min(1, "Option 2 is required").optional(),
    option3: z.string().min(1, "Option 3 is required").optional(),
    option4: z.string().min(1, "Option 4 is required").optional(),
});
export default function AddQuestionForm(_a) {
    var _b;
    var initialData = _a.initialData, onSubmit = _a.onSubmit, onCancel = _a.onCancel, _c = _a.isSubmitting, isSubmitting = _c === void 0 ? false : _c;
    // Parse initial options if provided
    var defaultValues = __assign({ title: "", content: "", type: "multiple-choice", category: "Algorithms", difficulty: "medium", correctAnswer: "" }, initialData);
    // Add individual options to form if they exist
    if ((_b = initialData === null || initialData === void 0 ? void 0 : initialData.options) === null || _b === void 0 ? void 0 : _b.length) {
        defaultValues.option1 = initialData.options[0] || "";
        defaultValues.option2 = initialData.options[1] || "";
        defaultValues.option3 = initialData.options[2] || "";
        defaultValues.option4 = initialData.options[3] || "";
    }
    // Form setup
    var form = useForm({
        resolver: zodResolver(questionFormSchema),
        defaultValues: defaultValues,
    });
    var questionType = form.watch("type");
    // Handle form submission
    var handleSubmit = function (data) {
        var formattedData = __assign({}, data);
        // Format options array for multiple choice questions
        if (data.type === "multiple-choice") {
            formattedData.options = [
                data.option1,
                data.option2,
                data.option3,
                data.option4,
            ].filter(Boolean);
            // Clean up form-specific fields
            delete formattedData.option1;
            delete formattedData.option2;
            delete formattedData.option3;
            delete formattedData.option4;
        }
        else {
            // For code questions, we don't need options
            formattedData.options = [];
        }
        onSubmit(formattedData);
    };
    return (<Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
              <FormLabel>Question Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter question title" {...field}/>
              </FormControl>
              <FormMessage />
            </FormItem>);
        }}/>

        <FormField control={form.control} name="content" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
              <FormLabel>Question Text</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter the question text" rows={4} {...field}/>
              </FormControl>
              <FormMessage />
            </FormItem>);
        }}/>

        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="type" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                <FormLabel>Question Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type"/>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>);
        }}/>

          <FormField control={form.control} name="category" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category"/>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Algorithms">Algorithms</SelectItem>
                    <SelectItem value="Data Structures">Data Structures</SelectItem>
                    <SelectItem value="Programming">Programming</SelectItem>
                    <SelectItem value="Databases">Databases</SelectItem>
                    <SelectItem value="Networking">Networking</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>);
        }}/>

          <FormField control={form.control} name="difficulty" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                <FormLabel>Difficulty</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty"/>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>);
        }}/>
        </div>

        {questionType === "multiple-choice" && (<div className="space-y-4">
            <FormField control={form.control} name="correctAnswer" render={function (_a) {
                var field = _a.field;
                return (<FormItem>
                  <FormLabel>Correct Answer</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-3">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={form.watch("option1") || ""} id="option1"/>
                        <FormField control={form.control} name="option1" render={function (_a) {
                        var field = _a.field;
                        return (<FormItem className="flex-1 m-0">
                              <FormControl>
                                <Input placeholder="Option 1" {...field}/>
                              </FormControl>
                              <FormMessage />
                            </FormItem>);
                    }}/>
                      </div>

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={form.watch("option2") || ""} id="option2"/>
                        <FormField control={form.control} name="option2" render={function (_a) {
                        var field = _a.field;
                        return (<FormItem className="flex-1 m-0">
                              <FormControl>
                                <Input placeholder="Option 2" {...field}/>
                              </FormControl>
                              <FormMessage />
                            </FormItem>);
                    }}/>
                      </div>

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={form.watch("option3") || ""} id="option3"/>
                        <FormField control={form.control} name="option3" render={function (_a) {
                        var field = _a.field;
                        return (<FormItem className="flex-1 m-0">
                              <FormControl>
                                <Input placeholder="Option 3" {...field}/>
                              </FormControl>
                              <FormMessage />
                            </FormItem>);
                    }}/>
                      </div>

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={form.watch("option4") || ""} id="option4"/>
                        <FormField control={form.control} name="option4" render={function (_a) {
                        var field = _a.field;
                        return (<FormItem className="flex-1 m-0">
                              <FormControl>
                                <Input placeholder="Option 4" {...field}/>
                              </FormControl>
                              <FormMessage />
                            </FormItem>);
                    }}/>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>);
            }}/>
          </div>)}

        {questionType === "code" && (<FormField control={form.control} name="correctAnswer" render={function (_a) {
                var field = _a.field;
                return (<FormItem>
                <FormLabel>Correct Answer (Code Solution)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter the correct code solution" rows={8} className="font-mono" {...field}/>
                </FormControl>
                <FormMessage />
              </FormItem>);
            }}/>)}

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            {initialData ? "Update" : "Save"} Question
          </Button>
        </div>
      </form>
    </Form>);
}
