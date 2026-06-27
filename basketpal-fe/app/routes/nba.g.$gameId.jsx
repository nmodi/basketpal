import { Flex, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { useLoaderData, useParams, useRouteError, isRouteErrorResponse } from '@remix-run/react';
import ErrorPage from '../components/ErrorPage';
import { GameHeader } from '../components/Header';
import { json } from '@remix-run/node';
import { useEffect, useState, useRef } from 'react';
// import { getMainColor, getSecondaryColor } from 'nba-color';

import OnCourtPlayers from '../components/OnCourtPlayers';
import Scoreboard from '../components/Scoreboard/Scoreboard';
import TeamStatsComparison from '../components/TeamStatsComparison';
import GamePreview from '../components/GamePreview';
import Postgame from '../components/Postgame';
import axios from '../util/axios';
import { toRouteError } from '../util/loaderError';
import { getLeague, League } from '../util/league';

export const meta = ({ data }) => {
    const game = data?.boxscore;
    if (!game) {
        return [{ title: 'Basketpal' }];
    }

    const away = game.awayTeam;
    const home = game.homeTeam;
    const title = `${away.teamTricode} @ ${home.teamTricode} | Basketpal`;

    return [
        { title },
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
    const [summary, setSummary] = useState(undefined); // undefined=loading, null=failed
    const [preview, setPreview] = useState(undefined);

    const fetchInterval = 5000; 

    const isGameStarted = gameData.gameStatus !== 1;
    const isGameInProgress = gameData.gameStatus === 2;
    const isGameOver = gameData.gameStatus === 3;
    // Old FINAL games fall back to a historical data source with no on-court
    // info; recently-finished games still have it from the live feed.
    const hasOnCourtData = gameData.homeTeam.onCourtPlayers?.length > 0 || gameData.awayTeam.onCourtPlayers?.length > 0;

    
    useEffect(() => {
        const fetchData = async () => {
            try {
                let response;

                if (!isGameStarted) {
                    response = await axios.get(`/games/${params.gameId}`);
                } else {
                    response = await axios.get(`/games/${params.gameId}/boxscore`)
                }

                if (!isGameOver) {
                    const newData = response.data;

                    if (isGameInProgress) {
                        queueRef.current.push(newData);
                        const queueLength = (uiDelay / fetchInterval) - 1;

                        let nextData;
                        while (queueRef.current.length > queueLength) {
                            nextData = queueRef.current.shift();
                        }
                        if (nextData) {
                            setGameData(nextData);
                        }
                    } else {
                        setGameData(newData);
                    }
                }
            } catch (error) {
                console.error('Failed to poll game data', error);
            }
        };

        const interval = setInterval(fetchData, isGameStarted ? fetchInterval : 30000);

        return () => clearInterval(interval);
    }, [uiDelay, isGameStarted, isGameInProgress, isGameOver, params.gameId]);

    useEffect(() => {
        if (isGameOver) {
            axios.get(`/games/${params.gameId}/summary`)
                .then(r => setSummary(r.data))
                .catch(() => setSummary(null));
        }
    }, [isGameOver, params.gameId]);

    useEffect(() => {
        if (!isGameStarted) {
            axios.get(`/games/${params.gameId}/matchup-preview`)
                .then(r => setPreview(r.data))
                .catch(() => setPreview(null));
        }
    }, [isGameStarted, params.gameId]);

    const tabStyle = {
        fontSize: 'sm',
        fontWeight: 'bold',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'fgMuted',
        pb: '3',
        mr: '6',
        px: '0',
        _selected: {
            color: 'fg',
            borderBottom: '2px solid',
            borderColor: 'highlight',
            mb: '-1px',
        },
        _hover: { color: 'fg' },
    };

    return (
        <Flex
            justify="space-around"
            align="center"
            direction="column"
            color="white"
            fontFamily="tt-autonomous-mono"
            pt="53px"
        >
            <GameHeader back={league === League.WNBA ? '/wnba' : '/'} />
                    <Scoreboard gameData={gameData} uiDelay={uiDelay} setUiDelay={setUiDelay} />
                    <Tabs
                        variant="unstyled"
                        width="90%"
                        mx="auto"
                    >
                        <TabList
                            borderBottom="1px solid"
                            borderColor="line"
                            mb="4"
                        >
                            {!isGameStarted && <Tab {...tabStyle}>Game Preview</Tab>}
                            {isGameOver && <Tab {...tabStyle}>Postgame Report</Tab>}
                            {isGameStarted && hasOnCourtData && <Tab {...tabStyle}>On Court</Tab>}
                            {isGameStarted && <Tab {...tabStyle}>Team Stats</Tab>}
                        </TabList>

                        <TabPanels>
                            {!isGameStarted && (
                                <TabPanel>
                                    <GamePreview gameData={gameData} preview={preview} />
                                </TabPanel>
                            )}

                            {isGameOver && (
                                <TabPanel>
                                    <Postgame gameData={gameData} summary={summary} league={league} />
                                </TabPanel>
                            )}

                            {isGameStarted && hasOnCourtData && (
                                <TabPanel>
                                    <Flex gap="4" width="100%" alignItems="stretch">
                                        <OnCourtPlayers gameData={gameData} isHome />
                                        <OnCourtPlayers gameData={gameData} />
                                    </Flex>
                                </TabPanel>
                            )}

                            {isGameStarted && (
                                <TabPanel>
                                    <TeamStatsComparison
                                        leftTeam={gameData.homeTeam}
                                        rightTeam={gameData.awayTeam}
                                        league={league} />
                                </TabPanel>
                            )}

                        </TabPanels>
                    </Tabs>

        </Flex>
    );
};

export function ErrorBoundary() {
    const error = useRouteError();
    const status = isRouteErrorResponse(error) ? error.status : 500;
    return <ErrorPage status={status} />;
}

export default Minitron;
