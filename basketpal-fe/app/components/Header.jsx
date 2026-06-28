import { Link } from '@remix-run/react';
import styles from './Header.module.css';

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
        </header>
    );
}

export function GameHeader({ back = '/' }) {
    return (
        <header className={styles.header}>
            <Link to={back} className={styles.label}>
                ← SCHEDULE
            </Link>
        </header>
    );
}
