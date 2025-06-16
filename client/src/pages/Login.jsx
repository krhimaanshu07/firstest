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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CheckCircle } from "lucide-react";
export default function Login(_a) {
    var _this = this;
    var onLogin = _a.onLogin;
    var _b = useLocation(), setLocation = _b[1];
    var _c = useState(false), isLoading = _c[0], setIsLoading = _c[1];
    var _d = useState("login"), activeTab = _d[0], setActiveTab = _d[1];
    var form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });
    var onSubmit = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var success;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    return [4 /*yield*/, onLogin(data.username, data.password)];
                case 1:
                    success = _a.sent();
                    setIsLoading(false);
                    if (success) {
                        // Login successful, will be redirected by the parent component
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className="flex min-h-screen">
      {/* Left Section (Dark) */}
      <div className="w-full md:w-1/2 bg-neutral-900 p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-neutral-800">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register" disabled className="text-neutral-400">
                Register Student
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Card className="bg-neutral-900 border-neutral-800">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
                  <p className="text-neutral-400 mb-6">
                    Enter your credentials to access the assessment platform.
                  </p>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField control={form.control} name="username" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                            <FormLabel className="text-neutral-300">Username / Student ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username or ID" {...field} className="bg-neutral-800 border-neutral-700 text-white focus:ring-primary"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>);
        }}/>
                      <FormField control={form.control} name="password" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                            <FormLabel className="text-neutral-300">Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} className="bg-neutral-800 border-neutral-700 text-white focus:ring-primary"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>);
        }}/>
                      <Button type="submit" className="w-full bg-primary hover:bg-secondary" disabled={isLoading}>
                        {isLoading ? "Signing In..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Section (Blue) */}
      <div className="hidden md:block md:w-1/2 bg-primary">
        <div className="h-full flex items-center justify-center p-8">
          <div className="max-w-md text-white">
            <h1 className="text-3xl font-bold mb-4">
              Computer Science Assessment Platform
            </h1>
            <p className="text-blue-100 mb-8">
              Welcome to the CS placement test platform. This assessment consists of 40
              medium-difficulty computer science questions and has a time limit of 2 hours.
            </p>

            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0 mr-2">
                  <CheckCircle className="h-6 w-6 text-white"/>
                </div>
                <p>
                  Multiple-choice and coding questions covering algorithms, data structures,
                  and more
                </p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mr-2">
                  <CheckCircle className="h-6 w-6 text-white"/>
                </div>
                <p>Real-time progress tracking and automatic scoring</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 mr-2">
                  <CheckCircle className="h-6 w-6 text-white"/>
                </div>
                <p>Strict 2-hour time limit with warnings as time runs low</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>);
}
