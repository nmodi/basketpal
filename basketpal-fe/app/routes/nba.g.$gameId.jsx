import { Flex, HStack, Select, Text, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { useLoaderData, useParams } from '@remix-run/react';
import { json } from '@remix-run/node';
import { useEffect, useState, useRef } from 'react';
// import { getMainColor, getSecondaryColor } from 'nba-color';

import OnCourtPlayers from '../components/OnCourtPlayers';
import Scoreboard from '../components/Scoreboard/Scoreboard';
import TeamStatsComparison from '../components/TeamStatsComparison';
import GamePreview from '../components/GamePreview';
import Postgame from '../components/Postgame';
import axios from '../util/axios';

export const loader = async ({ params }) => {
    const gameId = params.gameId;
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
                response = await fetch('http://127.0.0.1:8000/games');
            } else {
                // response = await fetch(`https://basketpal-be.onrender.com/games/${params.gameId}/boxscore`)
                response = await fetch(`http://127.0.0.1:8000/games/${params.gameId}/boxscore`)
            }

            if (!isGameOver) {
                const newData = await response.json();

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

    // const { homeTeam, awayTeam } = gameData;
    // const homeMainColor = getMainColor(homeTeam.teamTricode).hex;
    // const awayMainColor = getMainColor(awayTeam.teamTricode).hex;

    return (
        <Flex
            justify="space-around"
            align="center"
            direction="column"
            color="white"
            fontFamily="tt-autonomous-mono"
        >
                    <Scoreboard gameData={gameData} />
                    <Tabs 
                        align="center" 
                        size="md" 
                        variant="enclosed" 
                        width="100%"
                    >
                        <TabList  w="100%">
                            {!isGameStarted && <Tab>Game Preview</Tab>}
                            {isGameOver && <Tab>Postgame Report</Tab>}
                            {isGameStarted && <Tab>On Court</Tab>}
                            {isGameStarted && <Tab>Team Comparison</Tab>}
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
                                    <Flex justify="space-around" width="100%" alignItems="stretch">
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

                    {isGameInProgress && (
                        <HStack>
                            <Text>Delay</Text>
                            <Select w="100px" value={uiDelay} onChange={(e) => setUiDelay(e.target.value)}>
                                <option value={0}>None</option>
                                <option value={10000}>10s</option>
                                <option value={30000}>30s</option>
                                <option value={45000}>45s</option>
                                <option value={60000}>60s</option>
                                <option value={90000}>90s</option>
                                <option value={120000}>120s</option>
                            </Select>
                        </HStack>
                    )}
        </Flex>
    );
};

export default Minitron;
