import { useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import styles from '../styles/ScheduleIndex.module.css';

export function dateLabel(dateStr) {
    const todayStr = dayjs().format('YYYY-MM-DD');
    const d = dayjs(dateStr);
    const label = d.format('ddd MMM D').toUpperCase();
    return dateStr === todayStr ? `TODAY — ${label}` : label;
}

export default function DateBar({ gameDates, selectedDate, onSelectDate }) {
    const [weekOffset, setWeekOffset] = useState(0);
    const today = dayjs().startOf('day');
    const todayStr = today.format('YYYY-MM-DD');
    const startIdx = weekOffset * 7 - 3;
    const dates = Array.from({ length: 7 }, (_, i) => today.add(startIdx + i, 'day'));

    const datesWithGames = new Set(
        (gameDates || []).map(({ gameDate }) => dayjs(gameDate).format('YYYY-MM-DD'))
    );

    function handleSelectDate(dateStr) {
        const diff = dayjs(dateStr).startOf('day').diff(today, 'day');
        setWeekOffset(diff / 7);
        onSelectDate(dateStr);
    }

    return (
        <div className={styles.dateBar}>
            <button className={styles.dateArrow} onClick={() => setWeekOffset(w => w - 1)}>
                <CaretLeft size={18} weight="bold" />
            </button>
            <div className={styles.dateInner}>
                {dates.map(d => {
                    const dateStr = d.format('YYYY-MM-DD');
                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    const hasGames = datesWithGames.has(dateStr);

                    return (
                        <div
                            key={dateStr}
                            onClick={() => handleSelectDate(dateStr)}
                            className={`${styles.dateItem} ${isSelected ? styles.dateItemSelected : ''}`}
                        >
                            <span className={`${styles.dateDow} ${isSelected ? styles.dateDowSelected : ''} ${isToday && !isSelected ? styles.dateDowToday : ''}`}>
                                {d.format('ddd').toUpperCase()}
                            </span>
                            <span className={`${styles.dateNum} ${isSelected ? styles.dateNumSelected : ''} ${isToday && !isSelected ? styles.dateNumToday : ''}`}>
                                {d.format('MMM D').toUpperCase()}
                            </span>
                            <div className={styles.dateDot}>
                                {hasGames && <div className={`${styles.dot} ${isSelected ? styles.dotSelected : ''}`} />}
                            </div>
                        </div>
                    );
                })}
            </div>
            <button className={styles.dateArrow} onClick={() => setWeekOffset(w => w + 1)}>
                <CaretRight size={18} weight="bold" />
            </button>
        </div>
    );
}
