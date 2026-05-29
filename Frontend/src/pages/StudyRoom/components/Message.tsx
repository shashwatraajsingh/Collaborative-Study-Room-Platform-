import React from 'react';
import { Message as MessageType } from '../../../types/api.types';
import styles from '../StudyRoom.module.css';

interface MessageProps {
  message: MessageType;
  showSender: boolean;
}

export const Message: React.FC<MessageProps> = ({ message, showSender }) => {
  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '--:--';
    }
  };

  return (
    <div className={`${styles.messageWrapper} ${showSender ? styles.hasHeader : ''}`}>
      {showSender && (
        <div className={styles.messageSender} id={`msg-sender-${message.id}`}>
          {message.user?.username || 'unknown'}
        </div>
      )}
      <div className={styles.messageContentRow}>
        <span className={styles.messageText}>{message.content}</span>
        <span className={styles.messageTime}>{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
};
