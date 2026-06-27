import {
    Flex,
    Text,
    Box,
    HStack,
    VStack,
    SimpleGrid,
    Skeleton,
    SkeletonText,
} from '@chakra-ui/react';
import { getGameResult, getTopPlayers, evaluateKeysToTheWin } from '../util/gameUtils';
import { getBestStats } from '../util/statFunctions';
import TeamStatsComparison from './TeamStatsComparison';
import PlayerImage from './common/PlayerImage';

export default function Scoreboard({ gameData, summary, league }) {
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
                            <PlayerImage
                                league={league}
                                playerId={potg.playerId}
                                w="250px"
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
                            league={league}
                        />
                    </Box>
                </VStack>

            </Box>

            {/** right column */}
            <Box>
                {/** story */}
                <Box bg="gray.800" p="4" borderRadius="15px">
                    {summary === undefined ? (
                        <>
                            <Skeleton height="36px" mb="4" borderRadius="6px" startColor="gray.700" endColor="gray.600" />
                            <SkeletonText noOfLines={7} spacing="3" skeletonHeight="3" startColor="gray.700" endColor="gray.600" />
                            <SkeletonText mt="6" noOfLines={3} spacing="2" skeletonHeight="2" startColor="gray.700" endColor="gray.600" />
                        </>
                    ) : summary ? (
                        <>
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
                        </>
                    ) : (
                        <Text color="gray.500" fontSize="sm">Article unavailable</Text>
                    )}
                </Box>
            </Box>


        </SimpleGrid>
    ); 
}