import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { Room, ApiResponse } from '../../types/api.types';
import styles from './CreateRoom.module.css';

export const CreateRoom: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post<ApiResponse<Room>>('/rooms', {
        name,
        description: description || undefined,
      });

      const newRoom = response.data.data;
      navigate(`/rooms/${newRoom.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container} id="create-room-page">
      <main className={styles.card}>
        <header className={styles.header}>
          <Link to="/dashboard" className={styles.backLink}>
            &larr; back to dashboard
          </Link>
          <h1 className={styles.title}>create study room</h1>
        </header>

        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label htmlFor="name" className={styles.label}>
              Room Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className={styles.input}
              placeholder="e.g. Systems Programming, Algorithms"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="description" className={styles.label}>
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              className={styles.textarea}
              placeholder="Provide a clear, brief objective for the study room."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
            id="create-room-btn"
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </form>
      </main>
    </div>
  );
};
