import {
    Flex,
    Image,
    Text,
    Box,
    HStack,
    VStack,
    SimpleGrid,
    Heading
} from '@chakra-ui/react';
import { getGameResult, getTopPlayers, evaluateKeysToTheWin } from '../util/gameUtils';
import { getBestStats } from '../util/statFunctions';
import TeamStatsComparison from './TeamStatsComparison';

export default function Scoreboard({ gameData, summary }) {
    const gameResult = getGameResult(gameData);
    const potg = getTopPlayers(gameResult.winningTeam, 1)[0];


    const keysToTheWin = evaluateKeysToTheWin(gameResult.winningTeam, gameResult.losingTeam, 10);

    return (
        <SimpleGrid templateColumns="2fr 3fr" gap="20px" width="80%">

            {/** left column */}
            <Box>
                <VStack spacing="20px">
                    {/** potg **/}
                    <Box bg="gray.800" p="4" borderRadius="15px" alignSelf="start" width="100%">
                        <Text
                            fontSize="3xl"
                            textTransform="uppercase"
                            fontWeight="bold"
                        >
                            Player of the Game
                        </Text>
                        <VStack>
                            <Image
                                src={`https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${potg.playerId}.png`}
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
                                {getBestStats(potg.stats, 4).map(stat => (
                                    <VStack px="4">
                                        <Text fontSize="2xl" mb="-3">{stat.value}</Text>
                                        <Text>{stat.name}</Text>
                                    </VStack>
                                ))}
                            </HStack>
                        </VStack>
                    </Box>

                    {/** stats */}
                    <Box bg="gray.800" p="4" borderRadius="15px" alignSelf="start" width="100%">
                        <TeamStatsComparison 
                            leftTeam={gameResult.winningTeam}
                            rightTeam={gameResult.losingTeam} 
                            leftTeamStats={keysToTheWin.winningTeamTopStats}
                            rightTeamStats={keysToTheWin.losingTeamTopStats}
                        />
                    </Box>
                </VStack>

            </Box>

            {/** right column */}
            <Box>
                {/** story */}
                <Box bg="gray.800" p="4" borderRadius="15px">
                        <Text
                            textTransform="uppercase"
                            fontSize="3xl"
                            mb="2"
                            fontWeight="bold"
                        >
                            {summary.headline}
                        </Text>

                        <Flex direction="column" gap="2" fontFamily="soleil">
                            {summary.recap.split("\n").filter(Boolean).map((p, i) => (
                                <Text whiteSpace="pre-line" align="left" textIndent="2em" key={i}>
                                    {p}
                                </Text>
                            ))}
                        </Flex>

                        {summary.keyMoments?.length > 0 && (
                            <VStack align="start" mt="4" spacing="1">
                                {summary.keyMoments.map((moment, i) => (
                                    <Text key={i} fontSize="sm" color="gray.400">
                                        Q{moment.quarter}: {moment.description}
                                    </Text>
                                ))}
                            </VStack>
                        )}
                </Box>
            </Box>


        </SimpleGrid>
    ); 
}