import { Flex, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { useLoaderData, useParams } from '@remix-run/react';
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
            return json({
                boxscore: scoreboard
            });
        }

        const [boxscore, summary] = await Promise.all([
            axios.get(`/games/${gameId}/boxscore`),
            axios.get(`/games/${gameId}/summary`),
        ]);

        return json({
            boxscore: boxscore.data,
            summary: summary.data
        });
    } catch (error) {
        throw toRouteError(error);
    }
};

const Minitron = () => {
    const {boxscore, summary} = useLoaderData();

    const [gameData, setGameData] = useState(boxscore);
    const queueRef = useRef([boxscore]);
    const params = useParams();
    const [uiDelay, setUiDelay] = useState(0);

    const fetchInterval = 5000; 

    const isGameStarted = gameData.gameStatus !== 1;
    const isGameInProgress = gameData.gameStatus === 2; 
    const isGameOver = gameData.gameStatus === 3; 

    
    useEffect(() => {
        const fetchData = async () => {

            let response; 

            if (!isGameStarted) {
                // response = await fetch('https://basketpal-be.onrender.com/games');
                // response = await fetch('http://127.0.0.1:8000/games');
                response = await axios.get("/games");
            } else {
                // response = await fetch(`https://basketpal-be.onrender.com/games/${params.gameId}/boxscore`)
                response = await axios.get(`/games/${params.gameId}/boxscore`)
            }

            if (!isGameOver) {
                const newData = response.data;

                if (isGameInProgress) {
                    queueRef.current.push(newData);
                    const queueLength = (uiDelay / fetchInterval) - 1; 

                    if (queueRef.current.length > queueLength) {
                        const nextData = queueRef.current.shift();
                        setGameData(nextData);
                    }
                }
            }
        };

        const interval = setInterval(fetchData, isGameStarted ? fetchInterval : '30000');

        return () => clearInterval(interval);
    }, []);

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
            <GameHeader />
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
                            {isGameStarted && <Tab {...tabStyle}>On Court</Tab>}
                            {isGameStarted && <Tab {...tabStyle}>Team Stats</Tab>}
                        </TabList>

                        <TabPanels>
                            {!isGameStarted && (
                                <TabPanel>
                                    <GamePreview gameData={gameData} />
                                </TabPanel>
                            )}

                            {isGameOver && (
                                <TabPanel>
                                    <Postgame gameData={gameData} summary={summary} />
                                </TabPanel>
                            )}

                            {isGameStarted && (
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
                                        rightTeam={gameData.awayTeam} />
                                </TabPanel>
                            )}

                        </TabPanels>
                    </Tabs>

        </Flex>
    );
};

export default Minitron;
