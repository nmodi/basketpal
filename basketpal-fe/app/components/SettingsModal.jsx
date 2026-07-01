import { useEffect, useRef, useState } from 'react';
import { X } from '@phosphor-icons/react';
import { getSettings, saveSettings, NBA_TEAMS, WNBA_TEAMS } from '../util/settings';
import styles from './SettingsModal.module.css';

export default function SettingsModal({ open, onClose }) {
    const dialogRef = useRef(null);
    const [settings, setSettings] = useState(getSettings);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open) dialog.showModal();
        else dialog.close();
    }, [open]);

    function update(key, value) {
        const next = { ...settings, [key]: value };
        setSettings(next);
        saveSettings(next);
    }

    return (
        <dialog ref={dialogRef} className={styles.dialog} onClose={onClose}>
            <div className={styles.header}>
                <span className={styles.title}>SETTINGS</span>
                <button className={styles.close} onClick={onClose}><X size={18} /></button>
            </div>

            <div className={styles.body}>
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Favorite Teams</h3>
                    <label className={styles.field}>
                        <span>NBA</span>
                        <select
                            className={styles.select}
                            value={settings.favTeamNBA}
                            onChange={e => update('favTeamNBA', e.target.value)}
                        >
                            <option value="">None</option>
                            {NBA_TEAMS.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className={styles.field}>
                        <span>WNBA</span>
                        <select
                            className={styles.select}
                            value={settings.favTeamWNBA}
                            onChange={e => update('favTeamWNBA', e.target.value)}
                        >
                            <option value="">None</option>
                            {WNBA_TEAMS.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </label>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Features</h3>
                    <label className={styles.toggle}>
                        <span>AI Features</span>
                        <input
                            type="checkbox"
                            checked={settings.aiEnabled}
                            onChange={e => update('aiEnabled', e.target.checked)}
                        />
                    </label>
                </section>
            </div>
        </dialog>
    );
}
