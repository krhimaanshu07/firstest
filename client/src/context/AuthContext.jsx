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
import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// Create the context with a default undefined value
var AuthContext = createContext(null);
// Auth Provider component
export var AuthProvider = function (_a) {
    var children = _a.children;
    var _b = useState(false), isAuthenticated = _b[0], setIsAuthenticated = _b[1];
    var _c = useState(null), user = _c[0], setUser = _c[1];
    var _d = useState(true), isLoading = _d[0], setIsLoading = _d[1];
    var toast = useToast().toast;
    // Check if the user is authenticated
    var checkAuth = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, userData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, 6, 7]);
                    setIsLoading(true);
                    return [4 /*yield*/, fetch("/api/auth/me", {
                            credentials: "include",
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    userData = _a.sent();
                    setUser(userData);
                    setIsAuthenticated(true);
                    return [2 /*return*/, true];
                case 3:
                    setUser(null);
                    setIsAuthenticated(false);
                    return [2 /*return*/, false];
                case 4: return [3 /*break*/, 7];
                case 5:
                    error_1 = _a.sent();
                    console.error("Auth check failed:", error_1);
                    setUser(null);
                    setIsAuthenticated(false);
                    return [2 /*return*/, false];
                case 6:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); }, []);
    // Login function
    var login = function (username, password) { return __awaiter(void 0, void 0, void 0, function () {
        var response, userData, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    setIsLoading(true);
                    return [4 /*yield*/, apiRequest("POST", "/api/auth/login", { username: username, password: password })];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    userData = _a.sent();
                    setUser(userData);
                    setIsAuthenticated(true);
                    toast({
                        title: "Login successful",
                        description: "Welcome back, ".concat(userData.username, "!"),
                    });
                    return [2 /*return*/, true];
                case 3:
                    error_2 = _a.sent();
                    console.error("Login failed:", error_2);
                    toast({
                        title: "Login failed",
                        description: error_2 instanceof Error ? error_2.message : "Invalid credentials",
                        variant: "destructive",
                    });
                    setUser(null);
                    setIsAuthenticated(false);
                    return [2 /*return*/, false];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Logout function
    var logout = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setIsLoading(true);
                    return [4 /*yield*/, apiRequest("POST", "/api/auth/logout", {})];
                case 1:
                    _a.sent();
                    setUser(null);
                    setIsAuthenticated(false);
                    toast({
                        title: "Logged out",
                        description: "You have been successfully logged out.",
                    });
                    return [3 /*break*/, 4];
                case 2:
                    error_3 = _a.sent();
                    console.error("Logout failed:", error_3);
                    toast({
                        title: "Logout failed",
                        description: "Failed to log out. Please try again.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 4];
                case 3:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Create the context value object
    var contextValue = {
        isAuthenticated: isAuthenticated,
        user: user,
        isLoading: isLoading,
        login: login,
        logout: logout,
        checkAuth: checkAuth,
    };
    return (<AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>);
};
// Custom hook to use the auth context
export var useAuthContext = function () {
    var context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
