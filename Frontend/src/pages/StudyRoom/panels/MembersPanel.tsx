import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Room } from '../../../types/api.types';
import { useRoomStore } from '../../../store/room.store';
import styles from '../StudyRoom.module.css';

interface MembersPanelProps {
  room: Room;
}

export const MembersPanel: React.FC<MembersPanelProps> = ({ room }) => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const onlineUsers = useRoomStore((state) => state.onlineUsers);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.inviteCode);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Fallback
    }
  };

  const allMembers = room.members || [];
  const membersMap = new Map<string, { username: string; isOnline: boolean }>();

  // Populate list of known static members as offline
  allMembers.forEach((member) => {
    if (member.user) {
      membersMap.set(member.userId, {
        username: member.user.username,
        isOnline: false,
      });
    }
  });

  // Override status to online for users active in WebSocket presence
  onlineUsers.forEach((user) => {
    const existing = membersMap.get(user.userId);
    membersMap.set(user.userId, {
      username: existing ? existing.username : user.username,
      isOnline: true,
    });
  });

  const memberList = Array.from(membersMap.entries()).map(([userId, info]) => ({
    userId,
    ...info,
  }));

  const handleLeaveRoom = () => {
    navigate('/dashboard');
  };

  return (
    <aside className={styles.leftPanel} aria-label="Room members list">
      <div className={styles.roomHeaderInfo}>
        <h2 className={styles.roomName}>{room.name}</h2>
        {room.description && <p className={styles.roomDescription}>{room.description}</p>}
      </div>

      <div className={styles.inviteSection}>
        <span className={styles.panelSubtitle}>invite code</span>
        <button
          type="button"
          onClick={handleCopyCode}
          className={styles.inviteCodeBtn}
          title="Click to copy invite code"
        >
          <span className={styles.codeText}>{room.inviteCode}</span>
          <span className={styles.copyIndicator}>{copied ? 'copied' : 'copy'}</span>
        </button>
      </div>

      <div className={styles.membersSection}>
        <span className={styles.panelSubtitle}>members ({memberList.length})</span>
        <ul className={styles.memberList}>
          {memberList.map((member) => (
            <li key={member.userId} className={styles.memberItem}>
              <span
                className={`${styles.presenceDot} ${member.isOnline ? styles.online : styles.offline}`}
                aria-hidden="true"
              >
                {member.isOnline ? '●' : '○'}
              </span>
              <span className={styles.memberName}>{member.username}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={handleLeaveRoom}
        className={styles.leaveBtn}
        id="leave-room-btn"
      >
        Leave Room
      </button>
    </aside>
  );
};
