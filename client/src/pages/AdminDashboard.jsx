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
import { useToast } from "@/hooks/use-toast";
import AdminTabs from "@/components/AdminTabs";
import QuestionManagement from "@/components/QuestionManagement";
import StudentManagement from "@/components/StudentManagement";
import ResultsManagement from "@/components/ResultsManagement";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/BackButton";
export default function AdminDashboard(_a) {
    var _this = this;
    var onLogout = _a.onLogout;
    var toast = useToast().toast;
    var _b = useState("questions"), activeTab = _b[0], setActiveTab = _b[1];
    var handleLogout = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, onLogout()];
                case 1:
                    _a.sent();
                    toast({
                        title: "Logged out",
                        description: "You have been successfully logged out",
                    });
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="bg-white border-b border-neutral-200 py-4 px-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <BackButton to="/"/>
          <h1 className="text-xl font-semibold text-neutral-800">Admin Dashboard</h1>
        </div>
        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </header>

      {/* Admin Tabs */}
      <div className="p-6">
        <AdminTabs activeTab={activeTab} onTabChange={setActiveTab}/>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "questions" && <QuestionManagement />}
          {activeTab === "students" && <StudentManagement />}
          {activeTab === "results" && <ResultsManagement />}
        </div>
      </div>
    </div>);
}
