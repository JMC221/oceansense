// src/modules/manager/Accounts.tsx
import { useState } from 'react';
import AccountForm from '../components/AccountForm';
import type { User, Vessel } from '../../App';

interface Props {
    users: User[];
    vessels: Vessel[];
    userLoggedIn: User;
    createUser:   (user: Omit<User, 'user_id'>) => Promise<void>;
    updateUser:   (id: number, user: Partial<User>) => Promise<void>;
    deleteUser:   (id: number) => Promise<void>;
    createVessel: (name: string) => Promise<void>;
    updateVessel: (id: number, name: string) => Promise<void>;
    deleteVessel: (id: number) => Promise<void>;
}

function Accounts({
    users, vessels, userLoggedIn,
    createUser, updateUser, deleteUser,
    createVessel, updateVessel, deleteVessel
}: Props) {

    const [editUser, setEditUser] = useState<Partial<User> | null>(null);
    const [search, setSearch] = useState('');
    const [showVesselManager, setShowVesselManager] = useState(false);
    const [newVesselName, setNewVesselName] = useState('');
    const [editVessel, setEditVessel] = useState<{ vessel_id: number; vessel_name: string } | null>(null);
    const [saving, setSaving] = useState(false);

    // Helpers

    function validateName(name: string, label: string): boolean {
        const regex = /^[A-Za-z]+(\s[A-Za-z]+)*$/;
        if (!name) { alert(`${label} is required`); return false; }
        if (!regex.test(name)) { alert(`${label} can only contain letters`); return false; }
        return true;
    }

    function capitalize(str: string) {
        return str.trim().charAt(0).toUpperCase() + str.trim().slice(1);
    }

    //Save user (create or update)

    async function save(formData: any) {
        const first = capitalize(formData.first_name || '');
        const last  = capitalize(formData.last_name  || '');

        if (!validateName(first, 'First name')) return;
        if (!validateName(last,  'Last name'))  return;

        const regexEmail    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const regexPassword = /^(?=.*[\d!@#$%^&*(),.?":{}|<>]).{8,}$/;

        if (!formData.email)                         { alert('Email is required'); return; }
        if (!regexEmail.test(formData.email))        { alert('Enter a valid email address!'); return; }
        if (!formData.vessel?.vessel_id && !editUser?.email) {
            alert('Please select a vessel'); return;
        }

        const isNewUser = !editUser?.user_id;
        const pwEntered = formData.password && formData.password.length > 0;

        // New accounts must have a password
        if (isNewUser && !pwEntered) { alert('Password is required for new accounts'); return; }

        // Validate the password whenever one is entered (add or edit)
        if (pwEntered && !regexPassword.test(formData.password)) {
            alert('Password must be at least 8 characters and contain a number or special character');
            return;
        }

        // Check email uniqueness (front-end guard; backend also enforces it)
        const emailTaken = users.some(
            u => u.email === formData.email && u.user_id !== editUser?.user_id
        );
        if (emailTaken) { alert('This email already exists!'); return; }

        const payload: Partial<User> = {
            first_name: first,
            last_name:  last,
            email:      formData.email,
            role:       formData.role || 'Captain',
            vessel:     formData.vessel?.vessel_id
                            ? { vessel_id: formData.vessel.vessel_id, vessel_name: '' }
                            : null
        };

        // Only include password if it was provided (avoid re-hashing blank strings)
        if (isNewUser || pwEntered) payload.password = formData.password;

        setSaving(true);
        try {
            if (editUser?.user_id) {
                await updateUser(editUser.user_id, payload);
            } else {
                await createUser(payload as Omit<User, 'user_id'>);
            }
            setEditUser(null);
        } catch (err: any) {
            alert(err.message || 'Save failed. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    //Delete user

    async function handleDeleteUser(user: User) {
        if (!user.user_id) return;
        if (!window.confirm('Delete this user?')) return;
        try {
            await deleteUser(user.user_id);
        } catch (err: any) {
            alert(err.message || 'Delete failed.');
        }
    }

    //Vessel manager

    async function handleAddVessel() {
        const name = newVesselName.trim();
        if (!name) { alert('Enter a vessel name'); return; }
        if (vessels.some(v => v.vessel_name.toLowerCase() === name.toLowerCase())) {
            alert('A vessel with that name already exists!'); return;
        }
        try {
            await createVessel(name);
            setNewVesselName('');
        } catch (err: any) {
            alert(err.message || 'Failed to add vessel.');
        }
    }

    async function handleDeleteVessel(vessel: Vessel) {
        if (!vessel.vessel_id) return;
        if (!window.confirm(`Delete vessel "${vessel.vessel_name}"?`)) return;
        try {
            await deleteVessel(vessel.vessel_id);
        } catch (err: any) {
            alert(err.message || 'Failed to delete vessel.');
        }
    }

    async function handleSaveEditVessel() {
        if (!editVessel) return;
        const name = editVessel.vessel_name.trim();
        if (!name) { alert('Enter a vessel name'); return; }
        if (vessels.some(v => v.vessel_name.toLowerCase() === name.toLowerCase() && v.vessel_id !== editVessel.vessel_id)) {
            alert('A vessel with that name already exists!'); return;
        }
        try {
            await updateVessel(editVessel.vessel_id, name);
            setEditVessel(null);
        } catch (err: any) {
            alert(err.message || 'Failed to update vessel.');
        }
    }

    //Filtered results

    const results = users.filter(user => {
        const status     = userLoggedIn.email === user.email ? 'Online' : 'Offline';
        const vesselName = user.vessel?.vessel_name ?? '';
        const searchable = `${user.first_name} ${user.last_name} ${user.email} ${user.role} ${status} ${vesselName}`.toLowerCase();
        return searchable.includes(search.toLowerCase());
    });

    //Render

    return (
        <div className='accounts-container'>
            <h1>User Accounts</h1>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <input
                    className='search'
                    placeholder='Search users...'
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', flexGrow: 1 }}
                />
                <button className="btn-primary" onClick={() => setShowVesselManager(true)}>
                    Vessels
                </button>
                <button
                    className="btn-primary"
                    onClick={() => setEditUser({ first_name: '', last_name: '', email: '', password: '', role: 'Captain', vessel: null })}
                >
                    Add Account
                </button>
            </div>

            <table className="table">
                <thead>
                    <tr>
                        <th>First</th>
                        <th>Last</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Vessel</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map(user => (
                        <tr key={user.user_id ?? user.email}>
                            <td>{user.first_name}</td>
                            <td>{user.last_name}</td>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>{user.vessel?.vessel_name ?? '—'}</td>
                            <td>{userLoggedIn.email === user.email ? 'Online' : 'Offline'}</td>
                            <td>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button className="btn-secondary" onClick={() => setEditUser(user)}>Edit</button>
                                    <button
                                        className="btn-danger"
                                        onClick={() => handleDeleteUser(user)}
                                        disabled={userLoggedIn.email === user.email}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Edit / Add user modal */}
            {editUser && (
                <div className='modal-overlay'>
                    <div className='modal-box'>
                        <AccountForm
                            user={editUser}
                            vessels={vessels}
                            cancel={() => setEditUser(null)}
                            save={save}
                        />
                        {saving && <p style={{ textAlign: 'center', color: '#888' }}>Saving...</p>}
                    </div>
                </div>
            )}

            {/* Vessel Manager modal */}
            {showVesselManager && (
                <div className='modal-overlay'>
                    <div className='modal-box'>
                        <h2 style={{ marginTop: 0, color: '#1e88e5' }}>Vessel Manager</h2>

                        <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '16px' }}>
                            <table className="table" style={{ marginBottom: 0 }}>
                                <thead>
                                <tr>
                                    <th>Vessel Name</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {vessels.map(vessel => {
                                    // Capture in a local const so TypeScript knows it's non-null
                                    // inside the onChange callback (optional-chaining in the
                                    // condition doesn't narrow inside closures).
                                    const isEditing = editVessel !== null && editVessel.vessel_id === vessel.vessel_id;
                                    const currentEdit = editVessel; // non-null when isEditing is true

                                    return (
                                        <tr key={vessel.vessel_id}>
                                            <td>
                                                {isEditing && currentEdit ? (
                                                    <input
                                                        value={currentEdit.vessel_name}
                                                        onChange={e => setEditVessel({ vessel_id: currentEdit.vessel_id, vessel_name: e.target.value })}
                                                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc', width: '100%' }}
                                                    />
                                                ) : (
                                                    vessel.vessel_name
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    {isEditing ? (
                                                        <button className="btn-primary" onClick={handleSaveEditVessel}>Save</button>
                                                    ) : (
                                                        <button
                                                            className="btn-secondary"
                                                            onClick={() => {
                                                                // vessel_id is always defined for persisted vessels;
                                                                // the non-null assertion is safe here.
                                                                const vid = vessel.vessel_id as number;
                                                                setEditVessel({ vessel_id: vid, vessel_name: vessel.vessel_name });
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                    <button className="btn-danger" onClick={() => handleDeleteVessel(vessel)}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <input
                                placeholder='New vessel name'
                                value={newVesselName}
                                onChange={e => setNewVesselName(e.target.value)}
                                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', flexGrow: 1 }}
                            />
                            <button className="btn-primary" onClick={handleAddVessel}>Add Vessel</button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                className="btn-secondary"
                                onClick={() => { setShowVesselManager(false); setEditVessel(null); setNewVesselName(''); }}
                            >
                                Back
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Accounts;
