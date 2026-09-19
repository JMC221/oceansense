// src/modules/components/AccountForm.tsx
import { useState } from 'react';
import type { User, Vessel } from '../../App';
import './AccountForm.css';

interface Props {
    user: Partial<User> & { password?: string };
    vessels: Vessel[];
    hiddenRole?: boolean;
    save: (data: any) => void;
    cancel: () => void;
}

function AccountForm({ user, vessels, hiddenRole = false, save, cancel }: Props) {

    const [form, setForm] = useState({
        first_name: user.first_name?.trim() ?? '',
        last_name:  user.last_name?.trim()  ?? '',
        email:      user.email?.trim()      ?? '',
        password:   user.password           ?? '',
        role:       user.role               ?? 'Captain',
        // Store only the vessel_id in the form; we resolve the full object on submit
        vessel_id:  user.vessel?.vessel_id?.toString() ?? ''
    });

    function change(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function submit() {
        // Build the payload that matches what the backend expects
        const vesselObj: Vessel | null = form.vessel_id
            ? { vessel_id: Number(form.vessel_id), vessel_name: '' }
            : null;

        const payload: any = {
            first_name: form.first_name,
            last_name:  form.last_name,
            email:      form.email,
            password:   form.password,
            role:       hiddenRole ? 'Captain' : form.role,
            vessel:     vesselObj
        };

        save(payload);
    }

    return (
        <div>
            <h2 style={{ marginTop: 0, color: '#1e88e5' }}>
                {user.email ? 'Edit account' : 'New account'}
            </h2>

            <input
                name='first_name'
                placeholder='First name'
                value={form.first_name}
                onChange={change}
            />
            <input
                name='last_name'
                placeholder='Last name'
                value={form.last_name}
                onChange={change}
            />
            <input
                name='email'
                placeholder='Email'
                value={form.email}
                onChange={change}
            />
            <input
                name='password'
                type='password'
                placeholder='Password (leave blank to keep unchanged)'
                value={form.password}
                onChange={change}
            />

            {!hiddenRole && (
                <>
                    {/* Vessel selector - driven by vessels from the backend */}
                    <select name='vessel_id' value={form.vessel_id} onChange={change}>
                        <option value=''>-- Select Vessel --</option>
                        {vessels.map(v => (
                            <option key={v.vessel_id} value={v.vessel_id}>{v.vessel_name}</option>
                        ))}
                    </select>

                    <select name='role' value={form.role} onChange={change}>
                        <option value='Captain'>Captain</option>
                        <option value='Manager'>Manager</option>
                    </select>
                </>
            )}

            <div className='actions'>
                <button onClick={submit}>Save</button>
                <button className='cancel' onClick={cancel}>Cancel</button>
            </div>
        </div>
    );
}

export default AccountForm;