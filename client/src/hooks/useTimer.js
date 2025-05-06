import { useState, useEffect, useRef, useCallback } from "react";
// Enhanced timer hook with support for persistence and auto-save
export default function useTimer(initialSeconds, onTimeUpdate) {
    if (initialSeconds === void 0) { initialSeconds = 0; }
    var _a = useState(initialSeconds), seconds = _a[0], setSeconds = _a[1];
    var _b = useState(false), isRunning = _b[0], setIsRunning = _b[1];
    var intervalRef = useRef(null);
    var autoSaveRef = useRef(null);
    // Last persisted time
    var lastPersistedTimeRef = useRef(initialSeconds);
    var clearIntervalRef = useCallback(function () {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (autoSaveRef.current) {
            clearInterval(autoSaveRef.current);
            autoSaveRef.current = null;
        }
    }, []);
    var startTimer = useCallback(function () {
        if (!isRunning) {
            setIsRunning(true);
            // Main countdown interval
            intervalRef.current = setInterval(function () {
                setSeconds(function (prevSeconds) {
                    if (prevSeconds <= 1) {
                        clearIntervalRef();
                        setIsRunning(false);
                        return 0;
                    }
                    return prevSeconds - 1;
                });
            }, 1000);
            // Auto-save interval (every 30 seconds)
            if (onTimeUpdate) {
                autoSaveRef.current = setInterval(function () {
                    // Get the current time directly from state using a callback
                    setSeconds(function (currentTime) {
                        // Only persist if time has changed by at least 10 seconds
                        if (Math.abs(lastPersistedTimeRef.current - currentTime) >= 10) {
                            onTimeUpdate(currentTime);
                            lastPersistedTimeRef.current = currentTime;
                        }
                        return currentTime; // Return unchanged to avoid re-render
                    });
                }, 30000);
            }
        }
    }, [isRunning, clearIntervalRef, onTimeUpdate]);
    var pauseTimer = useCallback(function () {
        clearIntervalRef();
        setIsRunning(false);
        // Persist the current time when paused
        if (onTimeUpdate && Math.abs(lastPersistedTimeRef.current - seconds) >= 1) {
            onTimeUpdate(seconds);
            lastPersistedTimeRef.current = seconds;
        }
    }, [clearIntervalRef, onTimeUpdate, seconds]);
    var resetTimer = useCallback(function () {
        clearIntervalRef();
        setIsRunning(false);
        setSeconds(initialSeconds);
        lastPersistedTimeRef.current = initialSeconds;
        // Notify about reset
        if (onTimeUpdate) {
            onTimeUpdate(initialSeconds);
        }
    }, [clearIntervalRef, initialSeconds, onTimeUpdate]);
    var updateTime = useCallback(function (newSeconds) {
        setSeconds(newSeconds);
        lastPersistedTimeRef.current = newSeconds;
    }, []);
    // Cleanup effect
    useEffect(function () {
        return function () {
            // Save time before unmounting
            if (onTimeUpdate && isRunning) {
                onTimeUpdate(seconds);
            }
            clearIntervalRef();
        };
    }, [clearIntervalRef, onTimeUpdate, seconds, isRunning]);
    return {
        seconds: seconds,
        isRunning: isRunning,
        startTimer: startTimer,
        pauseTimer: pauseTimer,
        resetTimer: resetTimer,
        updateTime: updateTime
    };
}
