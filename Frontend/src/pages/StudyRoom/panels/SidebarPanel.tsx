import React from 'react';
import { MembersPanel } from './MembersPanel';
import { SessionPanel } from './SessionPanel';
import { Room } from '../../../types/api.types';
import styles from '../StudyRoom.module.css';

interface SidebarPanelProps {
  room: Room;
  roomId: string;
  startSession: () => void;
  endSession: () => void;
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({ room, roomId, startSession, endSession }) => {
  return (
    <aside className={styles.sidebar}>
      <MembersPanel room={room} />
      <hr className={styles.sidebarDivider} />
      <SessionPanel roomId={roomId} startSession={startSession} endSession={endSession} showTimer={false} />
    </aside>
  );
};
