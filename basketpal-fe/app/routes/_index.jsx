import { useState, useRef, useEffect } from 'react';
import Microtron from '../components/Microtron';
import { ScheduleHeader } from '../components/Header';
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import axios from "../util/axios";
import { toRouteError } from "../util/loaderError";
import dayjs from 'dayjs';
import styles from '../styles/ScheduleIndex.module.css';

export const meta = () => {
    return [
        { title: 'NBA Schedule | Basketpal' },
        { name: 'description', content: 'Live NBA scores, schedule, and game tracking.' },
    ];
};

export const loader = async ({ request }) => {
    const startDate = dayjs().subtract(3, 'day').format('YYYY-MM-DD');
    const endDate = dayjs().add(10, 'day').format('YYYY-MM-DD');
    try {
        const response = await axios.get(`/games/upcoming?league=nba&start_date=${startDate}&end_date=${endDate}`);
        const data = response.data;
        const forced = new URL(request.url).searchParams.has('nba');
        if (!forced) {
            const todayStr = dayjs().format('YYYY-MM-DD');
            const hasTodayGames = data.some(({ gameDate }) => dayjs(gameDate).format('YYYY-MM-DD') === todayStr);
            if (!hasTodayGames) return redirect('/wnba');
        }
        return json(data);
    } catch (error) {
        throw toRouteError(error);
    }
};

function DateBar({ gameDates, selectedDate, onSelectDate }) {
    const scrollRef = useRef(null);
    const todayRef = useRef(null);

    const todayStr = dayjs().format('YYYY-MM-DD');
    const dates = Array.from({ length: 14 }, (_, i) => dayjs().add(i - 3, 'day'));

    const datesWithGames = new Set(
        (gameDates || []).map(({ gameDate }) => dayjs(gameDate).format('YYYY-MM-DD'))
    );

    useEffect(() => {
        if (todayRef.current && scrollRef.current) {
            const container = scrollRef.current;
            const el = todayRef.current;
            container.scrollLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
        }
    }, []);

    return (
        <div className={styles.dateBar}>
            <div ref={scrollRef} className={styles.dateScroll}>
                <div className={styles.dateInner}>
                    {dates.map(d => {
                        const dateStr = d.format('YYYY-MM-DD');
                        const isToday = dateStr === todayStr;
                        const isSelected = dateStr === selectedDate;
                        const hasGames = datesWithGames.has(dateStr);

                        return (
                            <div
                                key={dateStr}
                                ref={isToday ? todayRef : undefined}
                                onClick={() => onSelectDate(dateStr)}
                                className={`${styles.dateItem} ${isSelected ? styles.dateItemSelected : ''}`}
                            >
                                <span className={`${styles.dateDow} ${isSelected ? styles.dateDowSelected : ''}`}>
                                    {d.format('ddd').toUpperCase()}
                                </span>
                                <span className={`${styles.dateNum} ${isSelected ? styles.dateNumSelected : ''}`}>
                                    {d.format('D')}
                                </span>
                                <div className={styles.dateDot}>
                                    {hasGames && <div className={`${styles.dot} ${isSelected ? styles.dotSelected : ''}`} />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function Index() {
    const loaderData = useLoaderData();
    const fetcher = useFetcher();
    const data = fetcher.data ?? loaderData;
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

    const visibleGames = (data || []).filter(({ gameDate }) =>
        dayjs(gameDate).format('YYYY-MM-DD') === selectedDate
    );

    const hasLiveGames = visibleGames.some(({ games }) => games.some(g => g.gameStatus === 2));

    useEffect(() => {
        if (!hasLiveGames) return;
        const interval = setInterval(() => fetcher.load('/'), 30000);
        return () => clearInterval(interval);
    }, [hasLiveGames]);

    return (
        <div className={styles.page}>
            <ScheduleHeader league="NBA" />
            <DateBar gameDates={data} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            {visibleGames.length === 0 ? (
                <p className={styles.empty}>No games scheduled</p>
            ) : (
                visibleGames.map(({ gameDate, games }) => (
                    <div key={gameDate} className={styles.gamesGroup}>
                        {games.map(g => (
                            <Microtron key={g.gameId} game={g} />
                        ))}
                    </div>
                ))
            )}
        </div>
    );
}
