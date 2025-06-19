import {
    Flex,
    Image,
    Text,
    Box,
    HStack,
    VStack,
    Heading,
} from '@chakra-ui/react';
import { getGameResult, getTopPlayers, evaluateKeysToTheWin } from '../util/gameUtils';
import { getBestStats } from '../util/statFunctions';
import TeamStatsComparison from './TeamStatsComparison';

export default function Scoreboard({ gameData, summary }) {
    const gameResult = getGameResult(gameData);
    const potg = getTopPlayers(gameResult.winningTeam, 1)[0];


    const keysToTheWin = evaluateKeysToTheWin(gameResult.winningTeam, gameResult.losingTeam, 10);

    // console.log('keysToTheWin', keysToTheWin);

    console.log("summary", summary);

    

    // const topPlayers = getTopPlayers(homeTeam, 2).concat(getTopPlayers(awayTeam, 2))
    //     .sort((a, b) => b.gameScore - a.gameScore);

    return (
        <Flex direction="row" justify="center">
            <Box bg="gray.800" mx="4" p="4" borderRadius="15px">
                <Text
                    // fontFamily="monte-stella"
                    fontSize="3xl"
                    textTransform="uppercase"
                >
                    Player of the Game
                </Text>
                <VStack>
                    <Image
                        src={`https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${potg.personId}.png`}
                        w="250px"
                        // m="0 auto"
                        objectFit="contain"
                    />
                    <Text
                        textTransform="uppercase"
                        fontSize="4xl"
                    >
                        {potg.name}
                    </Text>
                    <HStack>
                        {getBestStats(potg.statistics, 4).map(stat => (
                            <VStack px="4">
                                <Text fontSize="2xl" mb="-3">{stat.value}</Text>
                                <Text>{stat.name}</Text>
                            </VStack>
                        ))}
                    </HStack>
                </VStack>
            </Box>

            <Box bg="gray.800" mx="4" p="4" borderRadius="15px">
                    <Text
                        textTransform="uppercase"
                        fontSize="4xl"
                    >
                        Postgame Report
                    </Text>
                    <Text>
                        {summary.output[0].content[0].text}
                    </Text>
            </Box>
            
            <Box bg="gray.800" p="4" borderRadius="15px">
                <TeamStatsComparison 
                    leftTeam={gameResult.winningTeam}
                    rightTeam={gameResult.losingTeam} 
                    leftTeamStats={keysToTheWin.winningTeamTopStats}
                    rightTeamStats={keysToTheWin.losingTeamTopStats}
                />
            </Box>
        </Flex>
    ); 
}