import {
    Flex,
    Text,
    Box,
    VStack,
    Skeleton,
    SkeletonText,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';



export default function GamePreview({gameData, preview}) {
    dayjs.extend(relativeTime)

    let isScheduled = true;
    if (dayjs(gameData.gameTimeUTC).unix() < 0) {
        isScheduled = false;
    }

    const gameTime = dayjs().isAfter(dayjs(gameData.gameTimeUTC)) ?
        "any minute now..."
        : dayjs(gameData.gameTimeUTC).fromNow();

    return (
        <Flex direction="column" align="center" gap="20px">
            {isScheduled ? (
                <Text fontSize="xl">Game starts {gameTime}</Text>
            ) : (
                <Text fontSize="xl">Game is not officially scheduled</Text>
            )}

            {preview === undefined && (
                <Box bg="gray.800" p="4" borderRadius="15px" width="80%">
                    <Skeleton height="36px" mb="4" borderRadius="6px" startColor="gray.700" endColor="gray.600" />
                    <SkeletonText noOfLines={5} spacing="3" skeletonHeight="3" startColor="gray.700" endColor="gray.600" />
                </Box>
            )}

            {preview?.headline && (
                <Box bg="gray.800" p="4" borderRadius="15px" width="80%">
                    <Text
                        textTransform="uppercase"
                        fontSize="3xl"
                        mb="2"
                        fontWeight="bold"
                    >
                        {preview.headline}
                    </Text>

                    <Flex direction="column" gap="2" fontFamily="soleil">
                        {preview.preview.split("\n").filter(Boolean).map((p, i) => (
                            <Text whiteSpace="pre-line" align="left" textIndent="2em" key={i}>
                                {p}
                            </Text>
                        ))}
                    </Flex>

                    {preview.playersToWatch?.length > 0 && (
                        <VStack align="start" mt="4" spacing="1">
                            {preview.playersToWatch.map((player, i) => (
                                <Text key={i} fontSize="sm" color="gray.400">
                                    {player.name} — {player.reason}
                                </Text>
                            ))}
                        </VStack>
                    )}

                    {preview.storylines?.length > 0 && (
                        <VStack align="start" mt="2" spacing="1">
                            {preview.storylines.map((storyline, i) => (
                                <Text key={i} fontSize="sm" color="gray.400">
                                    • {storyline}
                                </Text>
                            ))}
                        </VStack>
                    )}
                </Box>
            )}
        </Flex>
    );
}
