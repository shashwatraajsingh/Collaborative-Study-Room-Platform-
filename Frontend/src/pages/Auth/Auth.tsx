import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import api from '../../api/axios';
import { AuthResponse, ApiResponse } from '../../types/api.types';
import styles from './Auth.module.css';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useAuthStore();

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email, password }
        : { username, email, password };

      const response = await api.post<ApiResponse<AuthResponse>>(endpoint, payload);
      
      const { accessToken, refreshToken, user } = response.data.data;
      setAuth(accessToken, refreshToken, user);
      
      navigate('/dashboard');
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        'Authentication failed. Please verify your credentials.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (loginTab: boolean) => {
    setIsLogin(loginTab);
    setError(null);
    setEmail('');
    setPassword('');
    setUsername('');
  };

  return (
    <div className={styles.container} id="auth-page">
      <main className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>study_room</h1>
          <p className={styles.subtitle}>Collaborative space for focused developers</p>
        </header>

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            className={`${styles.tab} ${isLogin ? styles.activeTab : ''}`}
            onClick={() => handleTabChange(true)}
            role="tab"
            aria-selected={isLogin}
            id="login-tab"
          >
            Login
          </button>
          <button
            type="button"
            className={`${styles.tab} ${!isLogin ? styles.activeTab : ''}`}
            onClick={() => handleTabChange(false)}
            role="tab"
            aria-selected={!isLogin}
            id="register-tab"
          >
            Register
          </button>
        </div>

        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          {!isLogin && (
            <div className={styles.fieldGroup}>
              <label htmlFor="username" className={styles.label}>
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={styles.input}
                placeholder="developer"
                autoComplete="username"
              />
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              placeholder="you@domain.com"
              autoComplete="email"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
            id="auth-submit-btn"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </main>
    </div>
  );
};
