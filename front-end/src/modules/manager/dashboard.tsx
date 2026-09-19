// src/modules/manager/Dashboard.tsx
import { useState, useEffect } from 'react';
import './dashboard.css';
import { Fish, Waves, Calendar, TrendingUp } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ResponsiveContainer
} from 'recharts';

const BASE_URL = "/";

interface WeeklyActivity {
  day: string;
  fish: number;
}

interface TopSpecies {
  species: string;
  count: number;
}

interface DashboardStats {
  todaysCatch: number;
  todaysWeight: number;
  totalTrips: number;
  weeklyActivity: WeeklyActivity[];
  topSpecies: TopSpecies[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}api/dashboard/stats`)
      .then((response) => response.json())
      .then((data: DashboardStats) => {
        console.log('Fetched dashboard stats:', data);
        setStats(data);
      })
      .catch((error) => console.error('Error fetching dashboard stats:', error));
  }, []);

  if (!stats) return <p>Loading dashboard...</p>;

  const weeklyAverage: number =
    stats.weeklyActivity.length > 0
      ? Math.round(
          stats.weeklyActivity.reduce((sum, d) => sum + d.fish, 0) /
            stats.weeklyActivity.length
        )
      : 0;

  return (
    <main className="dashboard-main">
      {/* First Row - 4 Small Stats Cards */}
      <div className="stats-grid">
        {/* Card 1 - Today's Catch */}
        <div className="stat-card">
          <div className="card-header">
            <h4>Today's Catch</h4>
            <Fish size={20} className="card-icon" />
          </div>
          <div className="card-body">
            <h2 className="big-number">{stats.todaysCatch}</h2>
            <p className="card-description">fish caught today</p>
          </div>
        </div>

        {/* Card 2 - Total Weight */}
        <div className="stat-card">
          <div className="card-header">
            <h4>Total Weight</h4>
            <Waves size={20} className="card-icon" />
          </div>
          <div className="card-body">
            <h2 className="big-number">{stats.todaysWeight}</h2>
            <p className="card-description">kg caught today</p>
          </div>
        </div>

        {/* Card 3 - Total Trips */}
        <div className="stat-card">
          <div className="card-header">
            <h4>Total Trips</h4>
            <Calendar size={20} className="card-icon" />
          </div>
          <div className="card-body">
            <h2 className="big-number">{stats.totalTrips}</h2>
            <p className="card-description">all time</p>
          </div>
        </div>

        {/* Card 4 - Weekly Average */}
        <div className="stat-card">
          <div className="card-header">
            <h4>Weekly Average</h4>
            <TrendingUp size={20} className="card-icon" />
          </div>
          <div className="card-body">
            <h2 className="big-number">{weeklyAverage}</h2>
            <p className="card-description">fish per day</p>
          </div>
        </div>
      </div>

      {/* Second Row - 2 Big Chart Cards */}
      <div className="stats-grid-2">
        {/* Weekly Activity - Line Chart */}
        <div className="stat-card">
          <div className="card-header-2">
            <h4>Weekly Activity</h4>
            <p className="card-description">Your fishing activity over the last 7 days</p>
          </div>
          <div className="card-body chart-container">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={stats.weeklyActivity}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 13, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 13, fill: '#6b7280' }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="fish"
                  stroke="#007aff"
                  strokeWidth={3}
                  dot={{ fill: 'white', stroke: '#007aff', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Species - Bar Chart */}
        <div className="stat-card">
          <div className="card-header-2">
            <h4>Top Species</h4>
            <p className="card-description">Most frequently caught species</p>
          </div>
          <div className="card-body chart-container">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={stats.topSpecies}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="species" tick={{ fontSize: 13, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 13, fill: '#6b7280' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#007aff" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;