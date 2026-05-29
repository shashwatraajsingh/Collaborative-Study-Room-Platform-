import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { RoomMember, ApiResponse } from '../../types/api.types';
import styles from './JoinRoom.module.css';

export const JoinRoom: React.FC = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post<ApiResponse<RoomMember>>('/rooms/join', {
        inviteCode: inviteCode.trim(),
      });

      const memberInfo = response.data.data;
      navigate(`/rooms/${memberInfo.roomId}`);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Failed to join room. Verify the invite code is correct and that you are not already a member.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container} id="join-room-page">
      <main className={styles.card}>
        <header className={styles.header}>
          <Link to="/dashboard" className={styles.backLink}>
            &larr; back to dashboard
          </Link>
          <h1 className={styles.title}>join study room</h1>
        </header>

        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label htmlFor="inviteCode" className={styles.label}>
              Invite Code
            </label>
            <input
              type="text"
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
              maxLength={8}
              className={styles.input}
              placeholder="e.g. ABCdef12"
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
            id="join-room-btn"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </form>
      </main>
    </div>
  );
};
