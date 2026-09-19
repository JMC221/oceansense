// src/layout/Layout.tsx
import { NavLink, Outlet } from 'react-router-dom';
import { Map, BookOpen, LayoutDashboard, ShieldAlert, Users, Anchor, LogOut, Zap } from 'lucide-react';
import './Layout.css';

interface LayoutProps {
    role: 'Manager' | 'Captain';
    onLogout: () => void;
}

export const Layout = ({ role, onLogout }: LayoutProps) => {
    return (
        <div className="app-layout">
            <nav className="sidebar">

                <div className="sidebar-header">
                    <h1 className="sidebar-logo">OceanSense</h1>
                </div>

                <div className="nav-section">

                    {/* --- CAPTAIN VIEW --- */}
                    {role === 'Captain' && (
                        <>
                            <p className="nav-label">CAPTAIN VIEW</p>

                            <NavLink to="/captain/map" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                <Map size={20} />
                                <span>Captain's Map</span>
                            </NavLink>

                            <NavLink to="/captain/track-trip" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                <Anchor size={20} />
                                <span>Track Trip</span>
                            </NavLink>

                            <NavLink to="/captain/logbook" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                <BookOpen size={20} />
                                <span>Logbook</span>
                            </NavLink>

                            <NavLink to="/captain/quotas" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                <Zap size={20} />
                                <span>Quotas</span>
                            </NavLink>
                        </>
                    )}

                    {/* --- MANAGER VIEW --- */}
                    {role === 'Manager' && (
                        <>
                            <p className="nav-label">MANAGER VIEW</p>

                            <NavLink to="/manager/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                <LayoutDashboard size={20} />
                                <span>Dashboard</span>
                            </NavLink>

                            <NavLink to="/manager/map" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                <Map size={20} />
                                <span>Live Fleet Radar</span>
                            </NavLink>

                            <NavLink to="/manager/quotas" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                <LayoutDashboard size={20} />
                                <span>Quotas</span>
                            </NavLink>

                            <NavLink to="/manager/zones" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                <ShieldAlert size={20} />
                                <span>Zone Editor</span>
                            </NavLink>

                            <NavLink to="/manager/accounts" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                                <Users size={20} />
                                <span>Accounts</span>
                            </NavLink>
                        </>
                    )}
                </div>

                {/* --- SWITCH ACCOUNT BUTTON --- */}
                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                    <button
                        className="nav-item"
                        onClick={onLogout}
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#d92d20' }}
                    >
                        <LogOut size={20} />
                        <span>Switch Account</span>
                    </button>

                    <div className="sidebar-footer">
                        <p>© 2025 OceanSense</p>
                    </div>
                </div>

            </nav>

            <main className="content-area">
                <Outlet />
            </main>
        </div>
    );
};
