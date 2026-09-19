// src/modules/components/LoginScreen.tsx
import { useState } from 'react';
import AccountForm from './AccountForm';
import type { User } from '../../App';
import './LoginScreen.css';

interface Props {
    users: User[];
    onLogin: (user: User) => void;
    createUser: (user: Omit<User, 'user_id'>) => Promise<void>;
}

function LoginScreen({ users, onLogin, createUser }: Props) {
    // Modes: 'start' | 'login' | 'signup'
    const [mode, setMode] = useState<'start' | 'login' | 'signup'>('start');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    //Login
    // POSTs credentials to /api/users/login; backend returns the matched User or 401.

    async function handleLogin() {
        if (!email || !password) {
            alert('Please fill in all the fields!');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify({ email, password })
            });

            if (res.status === 401) {
                alert('Your email or password is incorrect!');
                return;
            }
            if (!res.ok) {
                const msg = await res.text();
                alert(msg || 'Login failed. Please try again.');
                return;
            }

            const user: User = await res.json();
            onLogin(user);
        } catch {
            alert('Could not reach the server. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    }

    //Sign up

    async function handleSignUp(formData: any) {
        // Auto-capitalise names
        const first = formData.first_name
            ? formData.first_name.trim().charAt(0).toUpperCase() + formData.first_name.trim().slice(1)
            : '';
        const last = formData.last_name
            ? formData.last_name.trim().charAt(0).toUpperCase() + formData.last_name.trim().slice(1)
            : '';

        // Front-end validation
        if (!first || !last || !formData.email || !formData.password) {
            alert('All fields must be filled in');
            return;
        }

        const regexName = /^[A-Za-z]+(\s[A-Za-z]+)*$/;
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const regexPassword = /^(?=.*[\d!@#$%^&*(),.?":{}|<>]).{8,}$/;

        if (!regexName.test(first)) { alert('First name can only contain letters'); return; }
        if (!regexName.test(last)) { alert('Last name can only contain letters'); return; }
        if (!regexEmail.test(formData.email)) { alert('Enter a valid email address!'); return; }
        if (users.some(u => u.email === formData.email)) { alert('This email already exists!'); return; }
        if (!regexPassword.test(formData.password)) {
            alert('Password must be at least 8 characters and contain a number or special character');
            return;
        }

        const newUser: Omit<User, 'user_id'> = {
            first_name: first,
            last_name: last,
            email: formData.email,
            password: formData.password,
            role: 'Captain',
            vessel: null
        };

        setLoading(true);
        try {
            await createUser(newUser);
            setMode('login');
            alert('Account created! Please log in.');
        } catch (err: any) {
            alert(err.message || 'Sign up failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    //Render: signup modal

    if (mode === 'signup') {
        return (
            <div className='modal-overlay'>
                <div className='modal-box'>
                    <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Create Account</h2>
                    <AccountForm
                        user={{ first_name: '', last_name: '', email: '', password: '', role: 'Captain', vessel: null }}
                        hiddenRole={true}
                        vessels={[]}
                        cancel={() => setMode('start')}
                        save={handleSignUp}
                    />
                </div>
            </div>
        );
    }

    //Render: login form

    if (mode === 'login') {
        return (
            <div className="login-container">
                <div className='login-box'>
                    <h1 className="login-logo">OceanSense</h1>
                    <h3 className="login-subtitle">Welcome Back</h3>

                    <div className="form-group">
                        <input
                            className="login-input"
                            placeholder='Email'
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <input
                            className="login-input"
                            type='password'
                            placeholder='Password'
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="login-actions">
                        <button className="btn-primary full-width" onClick={handleLogin} disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                        <button className="btn-secondary full-width" onClick={() => setMode('start')} disabled={loading}>
                            Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    //Render: start screen

    return (
        <div className='login-container'>
            <div className="login-box center-text">
                <h1 className="login-logo">OceanSense</h1>
                <p className="login-desc">Sustainable Fishing Operations Platform</p>
                <div className="login-actions vertical">
                    <button className="btn-primary full-width" onClick={() => setMode('login')}>Login</button>
                    <button className="btn-secondary full-width" onClick={() => setMode('signup')}>Sign up</button>
                </div>
            </div>
        </div>
    );
}

export default LoginScreen;