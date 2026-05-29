import React, { useEffect, useState } from 'react';
import { SessionTimer } from '../components/SessionTimer';
import { useRoomStore } from '../../../store/room.store';
import api from '../../../api/axios';
import { StudySession, ApiResponse } from '../../../types/api.types';
import styles from '../StudyRoom.module.css';

interface SessionPanelProps {
  roomId: string;
  startSession: () => void;
  endSession: () => void;
}

export const SessionPanel: React.FC<SessionPanelProps> = ({
  roomId,
  startSession,
  endSession,
}) => {
  const activeSession = useRoomStore((state) => state.activeSession);
  const sessionsHistory = useRoomStore((state) => state.sessionsHistory);
  const setSessionsHistory = useRoomStore((state) => state.setSessionsHistory);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchSessionHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await api.get<ApiResponse<StudySession[]>>(`/rooms/${roomId}/sessions`);
      // Sort and slice to last 5
      setSessionsHistory(response.data.data.slice(0, 5));
    } catch {
      // Silent catch
    } finally {
      setLoadingHistory(false);
    }
  };

  // Re-fetch history when the session finishes or when room changes
  useEffect(() => {
    fetchSessionHistory();
  }, [roomId, activeSession === null]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const formatDuration = (seconds: number | null): string => {
    if (seconds === null || seconds === undefined) return '--:--';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <aside className={styles.rightPanel} aria-label="Session stats and controls">
      <div className={styles.sessionControlSection}>
        <span className={styles.panelSubtitle}>current session</span>

        {activeSession ? (
          <div className={styles.activeSessionArea}>
            <SessionTimer startedAt={activeSession.startedAt} />
            <button
              type="button"
              onClick={endSession}
              className={`${styles.sessionBtn} ${styles.endSessionBtn}`}
              id="end-session-btn"
            >
              End Session
            </button>
          </div>
        ) : (
          <div className={styles.inactiveSessionArea}>
            <p className={styles.sessionStatusText}>No active session</p>
            <button
              type="button"
              onClick={startSession}
              className={`${styles.sessionBtn} ${styles.startSessionBtn}`}
              id="start-session-btn"
            >
              Start Session
            </button>
          </div>
        )}
      </div>

      <div className={styles.historySection}>
        <span className={styles.panelSubtitle}>recent sessions</span>
        {loadingHistory && sessionsHistory.length === 0 ? (
          <div className={styles.loadingHistoryText}>Loading history...</div>
        ) : sessionsHistory.length === 0 ? (
          <div className={styles.emptyHistoryText}>No study sessions recorded.</div>
        ) : (
          <ul className={styles.historyList}>
            {sessionsHistory.slice(0, 5).map((session) => (
              <li key={session.id} className={styles.historyItem}>
                <span className={styles.historyDate}>{formatDate(session.startedAt)}</span>
                <span className={styles.historyDuration}>
                  {formatDuration(session.durationSeconds)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};
