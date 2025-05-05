import { useState, useEffect, useRef, useCallback } from "react";

export default function useTimer(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearIntervalRef = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds <= 1) {
            clearIntervalRef();
            setIsRunning(false);
            return 0;
          }
          return prevSeconds - 1;
        });
      }, 1000);
    }
  }, [isRunning, clearIntervalRef]);

  const pauseTimer = useCallback(() => {
    clearIntervalRef();
    setIsRunning(false);
  }, [clearIntervalRef]);

  const resetTimer = useCallback(() => {
    clearIntervalRef();
    setIsRunning(false);
    setSeconds(initialSeconds);
  }, [clearIntervalRef, initialSeconds]);

  const updateTime = useCallback((newSeconds: number) => {
    setSeconds(newSeconds);
  }, []);

  useEffect(() => {
    return () => {
      clearIntervalRef();
    };
  }, [clearIntervalRef]);

  return {
    seconds,
    isRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    updateTime
  };
}
