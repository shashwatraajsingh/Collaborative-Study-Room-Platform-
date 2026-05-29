import React from 'react';
import { useRoomStore } from '../store/room.store';
import styles from './ReconnectBanner.module.css';

export const ReconnectBanner: React.FC = () => {
  const isConnected = useRoomStore((state) => state.isConnected);

  if (isConnected) {
    return null;
  }

  return (
    <div className={styles.banner} id="reconnect-banner">
      <span className={styles.text}>Reconnecting to study server...</span>
    </div>
  );
};
