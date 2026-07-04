import { useEffect, useRef, useState } from 'react';
import { X, CaretDown } from '@phosphor-icons/react';
import { getSettings, saveSettings, NBA_TEAMS, WNBA_TEAMS } from '../util/settings';
import styles from './SettingsModal.module.css';

const FEATURES = [
    { key: 'aiEnabled', title: 'AI Features', desc: 'AI-powered predictions, live trend analysis, and smart game summaries' },
    { key: 'notifications', title: 'Notifications', desc: 'Push alerts for game starts, score swings, and final results' },
    { key: 'spoilerShield', title: 'Spoiler Shield', desc: "Hide scores and outcomes for games you haven't watched yet" },
];

function TeamSelect({ teams, value, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const team = teams.find(t => String(t.id) === String(value));

    useEffect(() => {
        if (!open) return;
        const close = e => {
            if (!ref.current?.contains(e.target)) setOpen(false);
        };
        document.addEventListener('pointerdown', close);
        return () => document.removeEventListener('pointerdown', close);
    }, [open]);

    function pick(id) {
        onChange(id);
        setOpen(false);
    }

    return (
        <div
            className={styles.teamSelect}
            ref={ref}
            onKeyDown={e => {
                // Escape closes the dropdown without closing the dialog
                if (e.key === 'Escape' && open) {
                    e.preventDefault();
                    setOpen(false);
                }
            }}
        >
            <button
                type="button"
                className={styles.selectButton}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen(o => !o)}
            >
                {team ? (
                    <>
                        <span className={styles.chip} style={{ background: team.c1, color: team.c2 }}>
                            {team.abbr}
                        </span>
                        <span className={styles.teamName}>{team.name}</span>
                    </>
                ) : (
                    <span className={styles.teamNone}>None</span>
                )}
                <CaretDown size={12} className={styles.caret} />
            </button>
            {open && (
                <div className={styles.options} role="listbox">
                    <button type="button" className={styles.option} role="option" onClick={() => pick('')}>
                        <span className={styles.teamNone}>None</span>
                    </button>
                    {teams.map(t => (
                        <button
                            key={t.id}
                            type="button"
                            role="option"
                            aria-selected={t === team}
                            className={t === team ? `${styles.option} ${styles.optionSelected}` : styles.option}
                            onClick={() => pick(String(t.id))}
                        >
                            <span className={styles.chip} style={{ background: t.c1, color: t.c2 }}>
                                {t.abbr}
                            </span>
                            <span className={styles.teamName}>{t.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SettingsModal({ open, onClose }) {
    const dialogRef = useRef(null);
    const [settings, setSettings] = useState(getSettings);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open) {
            setSettings(getSettings());
            dialog.showModal();
        } else {
            dialog.close();
        }
    }, [open]);

    function update(key, value) {
        setSettings(prev => ({ ...prev, [key]: value }));
    }

    function save() {
        saveSettings(settings);
        onClose();
    }

    return (
        <dialog ref={dialogRef} className={styles.dialog} onClose={onClose}>
            <div className={styles.header}>
                <span className={styles.title}>SETTINGS</span>
                <button className={styles.close} onClick={onClose}><X size={20} /></button>
            </div>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Favorite Teams</h3>
                <div className={styles.teamRow}>
                    <span className={styles.leagueLabel}>NBA</span>
                    <TeamSelect
                        teams={NBA_TEAMS}
                        value={settings.favTeamNBA}
                        onChange={id => update('favTeamNBA', id)}
                    />
                </div>
                <div className={styles.teamRow}>
                    <span className={styles.leagueLabel}>WNBA</span>
                    <TeamSelect
                        teams={WNBA_TEAMS}
                        value={settings.favTeamWNBA}
                        onChange={id => update('favTeamWNBA', id)}
                    />
                </div>
            </section>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Features</h3>
                {FEATURES.map(f => (
                    <label key={f.key} className={styles.feature}>
                        <div>
                            <div className={styles.featureTitle}>{f.title}</div>
                            <div className={styles.featureDesc}>{f.desc}</div>
                        </div>
                        <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={settings[f.key]}
                            onChange={e => update(f.key, e.target.checked)}
                        />
                    </label>
                ))}
            </section>

            <div className={styles.footer}>
                <button className={styles.save} onClick={save}>SAVE</button>
            </div>
        </dialog>
    );
}
