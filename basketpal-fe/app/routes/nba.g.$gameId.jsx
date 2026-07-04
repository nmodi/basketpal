import { useLoaderData, useParams, useRouteError, isRouteErrorResponse } from '@remix-run/react';
import ErrorPage from '../components/ErrorPage';
import { GameHeader } from '../components/Header';
import { json } from '@remix-run/node';
import { useEffect, useState, useRef } from 'react';

import OnCourtPlayers from '../components/OnCourtPlayers';
import Scoreboard from '../components/Scoreboard/Scoreboard';
import TeamStatsComparison from '../components/TeamStatsComparison';
import GamePreview from '../components/GamePreview';
import Postgame from '../components/Postgame';
import axios from '../util/axios';
import { toRouteError } from '../util/loaderError';
import { getLeague, League } from '../util/league';
import styles from '../styles/GamePage.module.css';

export const meta = ({ data }) => {
    const game = data?.boxscore;
    if (!game) return [{ title: 'Basketpal' }];
    const away = game.awayTeam;
    const home = game.homeTeam;
    return [
        { title: `${away.teamTricode} @ ${home.teamTricode} | Basketpal` },
        { name: 'description', content: `${away.teamCity} ${away.teamName} vs ${home.teamCity} ${home.teamName}` },
    ];
};

export const loader = async ({ params }) => {
    const gameId = params.gameId;
    try {
        const scoreboardResponse = await axios.get(`/games/${gameId}`);
        const scoreboard = scoreboardResponse.data;

        if (scoreboard && scoreboard.gameStatus === 1) {
            return json({ boxscore: scoreboard });
        }

        const boxscoreResponse = await axios.get(`/games/${gameId}/boxscore`);
        return json({ boxscore: boxscoreResponse.data });
    } catch (error) {
        throw toRouteError(error);
    }
};

const Minitron = () => {
    const {boxscore} = useLoaderData();

    const [gameData, setGameData] = useState(boxscore);
    const queueRef = useRef([boxscore]);
    const params = useParams();
    const league = getLeague(params.gameId);
    const [uiDelay, setUiDelay] = useState(0);
    const [summary, setSummary] = useState(undefined);
    const [preview, setPreview] = useState(undefined);
    const [injuries, setInjuries] = useState(undefined);
    const [activeTab, setActiveTab] = useState(0);

    const fetchInterval = 5000;

    const isGameStarted = gameData.gameStatus !== 1;
    const isGameInProgress = gameData.gameStatus === 2;
    const isGameOver = gameData.gameStatus === 3;
    const hasOnCourtData = gameData.homeTeam.onCourtPlayers?.length > 0 || gameData.awayTeam.onCourtPlayers?.length > 0;

    const tabs = [
        !isGameStarted && { label: 'Game Preview', panel: <GamePreview gameData={gameData} preview={preview} injuries={injuries} /> },
        isGameOver && { label: 'Postgame Report', panel: <Postgame gameData={gameData} summary={summary} league={league} /> },
        isGameStarted && hasOnCourtData && {
            label: 'On Court',
            panel: (
                <div className={styles.onCourtGrid}>
                    <OnCourtPlayers gameData={gameData} />
                    <OnCourtPlayers gameData={gameData} isHome />
                </div>
            )
        },
        isGameStarted && { label: 'Team Stats', panel: <TeamStatsComparison leftTeam={gameData.awayTeam} rightTeam={gameData.homeTeam} league={league} /> },
    ].filter(Boolean);

    useEffect(() => {
        if (isGameOver) return;
        const fetchData = async () => {
            try {
                let response;
                if (!isGameStarted) {
                    response = await axios.get(`/games/${params.gameId}`);
                } else {
                    response = await axios.get(`/games/${params.gameId}/boxscore`);
                }

                const newData = response.data;
                if (isGameInProgress) {
                    queueRef.current.push(newData);
                    const queueLength = Math.max(0, uiDelay / fetchInterval - 1);
                    let nextData;
                    while (queueRef.current.length > queueLength) {
                        nextData = queueRef.current.shift();
                    }
                    if (nextData) setGameData(nextData);
                } else {
                    setGameData(newData);
                }
            } catch (error) {
                console.error('Failed to poll game data', error);
            }
        };

        const interval = setInterval(fetchData, isGameStarted ? fetchInterval : 30000);
        return () => clearInterval(interval);
    }, [uiDelay, isGameStarted, isGameInProgress, isGameOver, params.gameId]);

    useEffect(() => {
        if (!isGameOver) return;
        let stopped = false;
        let timeoutId;
        const poll = async () => {
            if (stopped) return;
            try {
                const r = await axios.get(`/games/${params.gameId}/summary`);
                if (r.status === 200) { setSummary(r.data); return; }
            } catch { setSummary(null); return; }
            if (!stopped) timeoutId = setTimeout(poll, 3000);
        };
        poll();
        return () => { stopped = true; clearTimeout(timeoutId); };
    }, [isGameOver, params.gameId]);

    useEffect(() => {
        if (isGameStarted) return;
        let stopped = false;
        let timeoutId;
        const poll = async () => {
            if (stopped) return;
            try {
                const r = await axios.get(`/games/${params.gameId}/matchup-preview`);
                if (r.status === 200) { setPreview(r.data); return; }
            } catch { setPreview(null); return; }
            if (!stopped) timeoutId = setTimeout(poll, 3000);
        };
        poll();
        return () => { stopped = true; clearTimeout(timeoutId); };
    }, [isGameStarted, params.gameId]);

    useEffect(() => {
        if (isGameStarted) return;
        axios.get(`/games/${params.gameId}/injuries`)
            .then(r => setInjuries(r.data))
            .catch(() => setInjuries(null));
    }, [isGameStarted, params.gameId]);

    const safeTab = Math.min(activeTab, tabs.length - 1);

    return (
        <div className={styles.page}>
            <GameHeader back={league === League.WNBA ? '/wnba' : '/'} />
            <Scoreboard gameData={gameData} uiDelay={uiDelay} setUiDelay={setUiDelay} />
            <div className={styles.tabsWrap}>
                {tabs.length > 1 && (
                    <div className={styles.tabList}>
                        {tabs.map((tab, i) => (
                            <button
                                key={tab.label}
                                className={`${styles.tab} ${safeTab === i ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab(i)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
                {tabs[safeTab]?.panel}
            </div>
        </div>
    );
};

export function ErrorBoundary() {
    const error = useRouteError();
    const status = isRouteErrorResponse(error) ? error.status : 500;
    return <ErrorPage status={status} />;
}

export default Minitron;
