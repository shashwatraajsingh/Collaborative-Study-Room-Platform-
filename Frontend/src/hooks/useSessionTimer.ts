import { useState, useEffect } from 'react';

export const useSessionTimer = (startedAt: string | null) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const startMs = new Date(startedAt).getTime();

    const updateTimer = () => {
      const nowMs = Date.now();
      const diffSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setElapsedSeconds(diffSeconds);
    };

    updateTimer();

    const intervalId = setInterval(updateTimer, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [startedAt]);

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  return {
    elapsedSeconds,
    formatted: formatTime(elapsedSeconds),
  };
};
