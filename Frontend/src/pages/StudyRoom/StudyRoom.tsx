import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useRoomStore } from '../../store/room.store';
import { useSocket } from '../../hooks/useSocket';
import { SidebarPanel } from './panels/SidebarPanel';
import { ChatPanel } from './panels/ChatPanel';
import { ReconnectBanner } from '../../components/ReconnectBanner';
import { SessionTimer } from './components/SessionTimer';
import api from '../../api/axios';
import { Room, Message, StudySession, ApiResponse } from '../../types/api.types';
import styles from './StudyRoom.module.css';

export const StudyRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const currentUser = useAuthStore((state) => state.user);
  const { setMessages, setActiveSession, clearRoomStore } = useRoomStore();

  const roomId = id || '';

  // Initialize socket connection using the custom hook
  const { sendMessage, startSession, endSession } = useSocket(roomId);

  useEffect(() => {
    if (!roomId) return;

    const loadRoomData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [roomRes, messagesRes, sessionsRes] = await Promise.all([
          api.get<ApiResponse<Room>>(`/rooms/${roomId}`),
          api.get<ApiResponse<Message[]>>(`/rooms/${roomId}/messages?limit=50`),
          api.get<ApiResponse<StudySession[]>>(`/rooms/${roomId}/sessions`),
        ]);

        setRoom(roomRes.data.data);
        setMessages(messagesRes.data.data);

        // Find if there is an active session for the logged-in user in this room
        const userActiveSession = sessionsRes.data.data.find(
          (s) => s.userId === currentUser?.id && s.endedAt === null
        );
        setActiveSession(userActiveSession || null);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
          'Failed to enter the room. Verify room membership.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadRoomData();

    return () => {
      // Clear all store variables on room leave/unmount
      clearRoomStore();
    };
  }, [roomId, currentUser?.id, setMessages, setActiveSession, clearRoomStore]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Entering study room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorText}>{error}</div>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className={styles.backBtn}
          id="back-to-dashboard-btn"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className={styles.roomContainer} id={`study-room-${roomId}`}>
      <ReconnectBanner />
      <div className={styles.topBarMobile}>
        <button className={styles.hamburgerBtn} onClick={() => setSidebarOpen(true)}>☰ Menu</button>
      </div>
      <div className={styles.roomContent}>
        <div className={`${styles.sidebarWrapper} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarCloseHeader}>
             <button className={styles.closeSidebarBtn} onClick={() => setSidebarOpen(false)}>✕ Close</button>
          </div>
          <SidebarPanel room={room} roomId={roomId} startSession={startSession} endSession={endSession} />
        </div>
        
        <div className={styles.chatAreaWrapper}>
          {useRoomStore.getState().activeSession && (
            <div className={styles.chatTopTimer}>
              <span className={styles.chatTopTimerLabel}>Active Session:</span>
              <SessionTimer startedAt={useRoomStore.getState().activeSession!.startedAt} />
            </div>
          )}
          <ChatPanel sendMessage={sendMessage} />
        </div>
      </div>
    </div>
  );
};
