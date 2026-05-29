import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import api from '../../api/axios';
import { DashboardStats, Room, ApiResponse } from '../../types/api.types';
import styles from './Dashboard.module.css';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, roomsRes] = await Promise.all([
          api.get<ApiResponse<DashboardStats>>('/dashboard/me'),
          api.get<ApiResponse<Room[]>>('/rooms/my'),
        ]);

        setStats(statsRes.data.data);
        setRooms(roomsRes.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout API failures and clear local session anyway
    } finally {
      clearAuth();
      navigate('/auth');
    }
  };

  const formatStudyTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Process daily breakdown for manual SVG rendering (last 7 days)
  const getLast7Days = (): string[] => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      days.push(`${year}-${month}-${date}`);
    }
    return days;
  };

  const getDayLabel = (dateStr: string): string => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const d = new Date(dateStr);
    return weekdays[d.getDay()];
  };

  const last7Dates = getLast7Days();
  const dailyDataMap = new Map(
    stats?.dailyBreakdown.map((item) => [item.date, item]) || []
  );

  const fullBreakdown = last7Dates.map((date) => {
    const entry = dailyDataMap.get(date);
    return {
      date,
      minutes: entry ? Math.round(entry.totalSeconds / 60) : 0,
      sessionCount: entry ? entry.sessionCount : 0,
    };
  });

  const maxMinutes = Math.max(...fullBreakdown.map((d) => d.minutes), 30); // scale max to at least 30

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorText}>{error}</div>
        <button type="button" onClick={() => window.location.reload()} className={styles.retryBtn}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container} id="dashboard-page">
      <header className={styles.header}>
        <div className={styles.userSection}>
          <h1 className={styles.welcome}>welcome, {user?.username}</h1>
          <span className={styles.userEmail}>{user?.email}</span>
        </div>
        <button type="button" onClick={handleLogout} className={styles.logoutBtn} id="logout-btn">
          Logout
        </button>
      </header>

      <main className={styles.content}>
        {/* Stats Grid */}
        <section className={styles.metricsGrid} aria-label="Study Metrics">
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>total study time</span>
            <span className={styles.metricValue}>
              {stats ? formatStudyTime(stats.totalStudyTimeSeconds) : '0h 0m'}
            </span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>sessions completed</span>
            <span className={styles.metricValue}>
              {stats ? stats.totalSessionsCount : 0}
            </span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>rooms joined</span>
            <span className={styles.metricValue}>
              {stats ? stats.roomsJoined : 0}
            </span>
          </div>
        </section>

        {/* Chart + Rooms Panel Layout */}
        <div className={styles.panelLayout}>
          {/* Custom SVG Bar Chart */}
          <section className={styles.chartSection}>
            <h2 className={styles.sectionTitle}>weekly breakdown (minutes)</h2>
            <div className={styles.chartWrapper}>
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 320 180"
                preserveAspectRatio="xMidYMid meet"
                className={styles.chartSvg}
                aria-label="Weekly study time bar chart"
              >
                {/* Y Axis Guide Lines */}
                <line x1="40" y1="25" x2="310" y2="25" stroke="#1A1A1A" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.2" />
                <line x1="40" y1="90" x2="310" y2="90" stroke="#1A1A1A" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.2" />
                <line x1="40" y1="155" x2="310" y2="155" stroke="#1A1A1A" strokeWidth="1" />

                {/* Y Axis Labels */}
                <text x="32" y="29" textAnchor="end" fontSize="0.65rem" fill="#1A1A1A" opacity="0.6">{maxMinutes}m</text>
                <text x="32" y="94" textAnchor="end" fontSize="0.65rem" fill="#1A1A1A" opacity="0.6">{Math.round(maxMinutes / 2)}m</text>
                <text x="32" y="159" textAnchor="end" fontSize="0.65rem" fill="#1A1A1A" opacity="0.6">0m</text>

                {/* Bars */}
                {fullBreakdown.map((item, index) => {
                  const plotWidth = 270;
                  const plotHeight = 130;
                  const barWidth = 24;
                  const stepX = plotWidth / 7;
                  
                  const x = 40 + index * stepX + (stepX - barWidth) / 2;
                  const barHeight = (item.minutes / maxMinutes) * plotHeight;
                  const y = 155 - barHeight;

                  const isPeak = item.minutes === Math.max(...fullBreakdown.map((d) => d.minutes)) && item.minutes > 0;

                  return (
                    <g key={item.date}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(barHeight, 1)} // ensure at least 1px height if user logged in
                        fill={isPeak ? '#5C6BC0' : '#1A1A1A'}
                        opacity={item.minutes === 0 ? 0.08 : 1}
                      />
                      {/* X Axis Labels */}
                      <text
                        x={x + barWidth / 2}
                        y="170"
                        textAnchor="middle"
                        fontSize="0.65rem"
                        fill="#1A1A1A"
                        opacity="0.6"
                      >
                        {getDayLabel(item.date)}
                      </text>
                      {/* Peak value label */}
                      {isPeak && (
                        <text
                          x={x + barWidth / 2}
                          y={y - 6}
                          textAnchor="middle"
                          fontSize="0.65rem"
                          fontWeight="700"
                          fill="#5C6BC0"
                        >
                          {item.minutes}m
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </section>

          {/* Rooms List Section */}
          <section className={styles.roomsSection}>
            <div className={styles.roomsHeader}>
              <h2 className={styles.sectionTitle}>my rooms</h2>
              <div className={styles.roomActions}>
                <Link to="/rooms/new" className={styles.linkBtn} id="create-room-link">
                  Create Room
                </Link>
                <span className={styles.separator}>/</span>
                <Link to="/rooms/join" className={styles.linkBtn} id="join-room-link">
                  Join by Invite
                </Link>
              </div>
            </div>

            {rooms.length === 0 ? (
              <div className={styles.emptyRooms}>
                <p>You have not joined any study rooms yet.</p>
                <p className={styles.emptyActionHint}>
                  Get started by creating a new room or joining one with an invite code.
                </p>
              </div>
            ) : (
              <ul className={styles.roomsList}>
                {rooms.map((room) => (
                  <li key={room.id} className={styles.roomItem}>
                    <div className={styles.roomInfo}>
                      <span className={styles.roomName}>{room.name}</span>
                      <span className={styles.roomMemberCount}>
                        {room.members ? `${room.members.length} members` : '1 member'}
                      </span>
                    </div>
                    <Link
                      to={`/rooms/${room.id}`}
                      className={styles.enterBtn}
                      id={`enter-room-${room.id}`}
                    >
                      Enter
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};
