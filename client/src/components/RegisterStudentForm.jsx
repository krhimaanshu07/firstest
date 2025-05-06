import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerStudentSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
export default function RegisterStudentForm(_a) {
    var onSubmit = _a.onSubmit, onCancel = _a.onCancel, _b = _a.isSubmitting, isSubmitting = _b === void 0 ? false : _b;
    // Form setup
    var form = useForm({
        resolver: zodResolver(registerStudentSchema),
        defaultValues: {
            username: "",
            password: "",
            confirmPassword: "",
            email: "",
            studentId: "",
            role: "student",
        },
    });
    // Generate random student ID
    var generateStudentId = function () {
        var year = new Date().getFullYear().toString().slice(2);
        var randomNumber = Math.floor(10000 + Math.random() * 90000);
        return "CS".concat(year).concat(randomNumber);
    };
    // Handle form submission
    var handleSubmit = function (data) {
        onSubmit(data);
    };
    return (<Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField control={form.control} name="username" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field}/>
              </FormControl>
              <FormMessage />
            </FormItem>);
        }}/>

        <FormField control={form.control} name="email" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email address" {...field}/>
              </FormControl>
              <FormMessage />
            </FormItem>);
        }}/>

        <FormField control={form.control} name="studentId" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
              <FormLabel>Student ID</FormLabel>
              <div className="flex space-x-2">
                <FormControl>
                  <Input placeholder="Enter or generate student ID" {...field}/>
                </FormControl>
                <Button type="button" variant="outline" onClick={function () { return form.setValue("studentId", generateStudentId()); }} className="shrink-0">
                  Generate
                </Button>
              </div>
              <FormMessage />
            </FormItem>);
        }}/>

        <FormField control={form.control} name="password" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter password" {...field}/>
              </FormControl>
              <FormMessage />
            </FormItem>);
        }}/>

        <FormField control={form.control} name="confirmPassword" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirm password" {...field}/>
              </FormControl>
              <FormMessage />
            </FormItem>);
        }}/>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Register Student
          </Button>
        </div>
      </form>
    </Form>);
}
