import { useState, useEffect } from 'react';
import Microtron from '../components/Microtron';
import { ScheduleHeader } from '../components/Header';
import DateBar, { dateLabel } from '../components/DateBar';
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import axios from "../util/axios";
import { toRouteError } from "../util/loaderError";
import dayjs from 'dayjs';
import styles from '../styles/ScheduleIndex.module.css';

export const meta = () => {
    return [
        { title: 'WNBA Schedule | Basketpal' },
        { name: 'description', content: 'Live WNBA scores, schedule, and game tracking.' },
    ];
};

export const loader = async () => {
    const startDate = dayjs().subtract(10, 'day').format('YYYY-MM-DD');
    const endDate = dayjs().add(17, 'day').format('YYYY-MM-DD');
    try {
        const response = await axios.get(`/games/upcoming?league=wnba&start_date=${startDate}&end_date=${endDate}`);
        return json(response.data);
    } catch (error) {
        throw toRouteError(error);
    }
};


export default function WnbaIndex() {
    const loaderData = useLoaderData();
    const fetcher = useFetcher();
    const data = fetcher.data ?? loaderData;
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

    const displayGroups = (data || [])
        .filter(({ gameDate }) => dayjs(gameDate).format('YYYY-MM-DD') >= selectedDate)
        .slice(0, 5);

    const hasLiveGames = displayGroups.some(({ games }) => games.some(g => g.gameStatus === 2));

    useEffect(() => {
        if (!hasLiveGames) return;
        const interval = setInterval(() => fetcher.load('/wnba'), 30000);
        return () => clearInterval(interval);
    }, [hasLiveGames]);

    return (
        <div className={styles.page}>
            <ScheduleHeader league="WNBA" />
            <DateBar gameDates={data} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            {displayGroups.length === 0 ? (
                <p className={styles.empty}>No games scheduled</p>
            ) : (
                displayGroups.map(item => (
                    <div key={item.gameDate} className={styles.gamesGroup}>
                        <p className={styles.groupHeader}>{dateLabel(String(item.gameDate))}</p>
                        {item.games.map(g => (
                            <Microtron key={g.gameId} game={g} />
                        ))}
                    </div>
                ))
            )}
        </div>
    );
}
