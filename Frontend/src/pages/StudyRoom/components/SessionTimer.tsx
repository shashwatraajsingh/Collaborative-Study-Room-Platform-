import React from 'react';
import { useSessionTimer } from '../../../hooks/useSessionTimer';
import styles from '../StudyRoom.module.css';

interface SessionTimerProps {
  startedAt: string | null;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({ startedAt }) => {
  const { formatted } = useSessionTimer(startedAt);

  return (
    <div className={styles.timerDisplay} id="session-timer-display">
      {formatted}
    </div>
  );
};
