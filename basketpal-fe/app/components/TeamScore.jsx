import {
    Flex,
    Badge,
    Box,
    Heading,
    Text,
    Tooltip
} from '@chakra-ui/react';


import { getMainColor, getSecondaryColor } from 'nba-color';

export default function TeamScore({gameData, isHome}) {

    const team = isHome ? gameData.homeTeam : gameData.awayTeam;
    const otherTeam = !isHome ? gameData.homeTeam : gameData.awayTeam;

    const mainColor = getMainColor(team.teamTricode).hex;
    const secondaryColor = getSecondaryColor(team.teamTricode).hex;

    const isGameInProgress = gameData.gameStatus === 2; 
    const isGameOver = gameData.gameStatus === 3; 

    const isTeamInBonus = team.inBonus === "1" && isGameInProgress ? true : false;
    const isWinningTeam = gameData.gameStatus === 3 && team.score > otherTeam.score;

    const timeoutIndicators = '⏱️'.repeat(team.timeoutsRemaining);

    return (
        <Flex 
            direction="column" 
            align={isHome ? 'flex-end' : 'flex-start'} 
            p="4" 
            width="80%" 
            bgGradient={`linear(${isHome ? 'to-br' : 'to-bl'}, ${mainColor}, gray.900 45%)`}
         >
                 
            <Heading color={secondaryColor}
                fontFamily="monte-stella"
                textTransform="uppercase"
            >
                {team.teamCity} {team.teamName} {isWinningTeam ? '🏆' : ''}

            </Heading>


            <Box fontSize="large">
            <Heading 
                bg="black"
                color="orange.100" 
                border="1px solid white" 
                px="4"
                pt="2"
                my="4" 
                borderRadius="5px"
                fontSize="6xl"
                fontFamily="tt-autonomous-mono"
            >
                {String(team.score).padStart(3, 0)}
            </Heading>

                <Flex justify="center">
                    <Tooltip label={`${team.timeoutsRemaining} Timeouts Remaining`} aria-label="Timeouts">
                        {timeoutIndicators}
                    </Tooltip>
                </Flex>
            
            {isTeamInBonus && (
                <Flex justify="center">
                    <Badge colorScheme="yellow" variant="outline">Bonus</Badge>
                </Flex>
            )}

            {/* <Flex justify="space-between">
                <Text mx="2" fontWeight="bold">Team Fouls</Text>
                <Text>{team.statistics.foulsTeam}</Text>
            </Flex>   
            <Flex justify="space-between">
                <Text mx="2" fontWeight="bold">Bench Points</Text>
                <Text>{team.statistics.benchPoints}</Text>
            </Flex>    */}
            
            </Box>



        </Flex>
    );
} 