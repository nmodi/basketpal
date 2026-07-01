import { useState } from 'react';
import { Link } from '@remix-run/react';
import { GearSix } from '@phosphor-icons/react';
import styles from './Header.module.css';
import SettingsModal from './SettingsModal';

function SettingsButton() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button className={styles.iconBtn} onClick={() => setOpen(true)} aria-label="Settings">
                <GearSix size={18} />
            </button>
            <SettingsModal open={open} onClose={() => setOpen(false)} />
        </>
    );
}

export function ScheduleHeader({ league }) {
    return (
        <header className={styles.header}>
            <span className={`${styles.label} ${styles.labelActive}`}>BASKETPAL</span>
            <nav className={styles.nav}>
                <Link to="/?nba=1" className={`${styles.label} ${league === 'NBA' ? styles.labelActive : ''}`}>
                    NBA
                </Link>
                <Link to="/wnba" className={`${styles.label} ${league === 'WNBA' ? styles.labelActive : ''}`}>
                    WNBA
                </Link>
            </nav>
            <SettingsButton />
        </header>
    );
}

export function GameHeader({ back = '/' }) {
    return (
        <header className={styles.header}>
            <Link to={back} className={styles.label}>
                ← SCHEDULE
            </Link>
            <SettingsButton />
        </header>
    );
}
