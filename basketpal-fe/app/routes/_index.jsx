import { useState, useEffect } from 'react';
import Microtron from '../components/Microtron';
import { ScheduleHeader } from '../components/Header';
import DateBar, { dateLabel } from '../components/DateBar';
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
    const startDate = dayjs().subtract(10, 'day').format('YYYY-MM-DD');
    const endDate = dayjs().add(17, 'day').format('YYYY-MM-DD');
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


export default function Index() {
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
        const interval = setInterval(() => fetcher.load('/'), 30000);
        return () => clearInterval(interval);
    }, [hasLiveGames]);

    return (
        <div className={styles.page}>
            <ScheduleHeader league="NBA" />
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
