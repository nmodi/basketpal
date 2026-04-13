import { Flex, Badge, Box, Heading, HStack, Tooltip, VStack } from '@chakra-ui/react';

import { getMainColor, getSecondaryColor } from 'nba-color';

export default function TeamScore({ gameData, isHome }) {
    const team = isHome ? gameData.homeTeam : gameData.awayTeam;
    const otherTeam = !isHome ? gameData.homeTeam : gameData.awayTeam;

    const mainColor = getMainColor(team.teamTricode)?.hex;
    const secondaryColor = getSecondaryColor(team.teamTricode)?.hex;

    const isGameInProgress = gameData.gameStatus === 2;
    const isGameOver = gameData.gameStatus === 3;

    const isTeamInBonus =
        team.inBonus === '1' && isGameInProgress ? true : false;
    const isWinningTeam =
        gameData.gameStatus === 3 && team.score > otherTeam.score;

    const timeoutIndicators = '⏱️'.repeat(team.timeoutsRemaining);


    const score = team.periodScores.reduce((acc, curr) => acc + curr, 0);

    return (
        <Flex
            direction="column"
            align={isHome ? 'flex-end' : 'flex-start'}
            p="2"
            width="80%"
            bgGradient={`linear(${
                isHome ? 'to-br' : 'to-bl'
            }, ${mainColor}, gray.900 45%)`}
        >
            <Heading
                color={secondaryColor}
                fontFamily="monte-stella"
                textTransform="uppercase"
                fontSize="3xl"
            >
                {team.teamCity} {team.teamName} {isWinningTeam ? '🏆' : ''}
            </Heading>

            <Flex 
                fontSize="large" 
                direction={isHome ? "row-reverse" : "row"}
                my="4"
            >
                <Heading
                    bg="black"
                    color="orange.100"
                    border="1px solid white"
                    px="4"
                    pt="2"
                    borderRadius="5px"
                    fontSize="5xl"
                    fontFamily="tt-autonomous-mono"
                >
                    {String(score).padStart(3, 0)}
                </Heading>


                <VStack 
                    mx="3"
                    align={isHome ? "end" : "start"}
                >
                    <Flex justify="center" 
                            minH="1.5em">
                        <Tooltip
                            label={`${team.timeoutsRemaining} Timeouts Remaining`}
                            aria-label="Timeouts"
                        >
                            {timeoutIndicators}
                        </Tooltip>
                    </Flex>

                    {isTeamInBonus && (
                        <Flex justify="center">
                            <Badge colorScheme="yellow" variant="outline">
                                Bonus
                            </Badge>
                        </Flex>
                    )}
                </VStack>
            </Flex>
        </Flex>
    );
}
