import { Box, Flex, Text, Image } from '@chakra-ui/react';
import { useNavigate } from "@remix-run/react";
import dayjs from 'dayjs';
import { getLeague, League } from '../util/league';

function getCountdownLabel(gameTimeUTC) {
    const gameTime = new Date(gameTimeUTC);
    const diffMs = gameTime.getTime() - Date.now();
    if (diffMs <= 0) return 'STARTING SOON';

    const isToday = new Date().toDateString() === gameTime.toDateString();
    if (!isToday) return 'SCHEDULED';

    const totalMin = Math.floor(diffMs / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h > 0 ? `STARTS IN ${h}H ${m}M` : `STARTS IN ${m}M`;
}

function logoSrc(teamId, league) {
    return league === League.NBA
        ? `https://cdn.nba.com/logos/nba/${teamId}/primary/L/logo.svg`
        : `https://cdn.wnba.com/logos/wnba/${teamId}/primary/D/logo.svg`;
}

export default function Microtron({ game }) {
    const navigate = useNavigate();
    const league = getLeague(game.gameId);
    const isScheduled = game.gameStatus === 1;
    const isLive = game.gameStatus === 2;
    const isFinal = game.gameStatus === 3;
    const gameTime = dayjs(game.gameTimeUTC).format('h:mm A');

    return (
        <Box
            bg="#0a1628"
            border="1px solid"
            borderColor="whiteAlpha.100"
            borderRadius="xl"
            overflow="hidden"
            w="420px"
            cursor="pointer"
            onClick={() => navigate(`/nba/g/${game.gameId}`)}
            _hover={{ borderColor: 'whiteAlpha.300', transform: 'translateY(-2px)', shadow: 'lg' }}
            transition="all 0.15s ease"
            m="2"
        >
            {/* Header */}
            <Flex px="5" pt="4" pb="3" justify="space-between" align="center">
                <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="whiteAlpha.500"
                    letterSpacing="widest"
                    textTransform="uppercase"
                >
                    {league}
                </Text>

                {isScheduled && (
                    <Box bg="cyan.500" px="3" py="1" borderRadius="md">
                        <Text fontSize="xs" fontWeight="bold" color="black" letterSpacing="wider">
                            {getCountdownLabel(game.gameTimeUTC)}
                        </Text>
                    </Box>
                )}
                {isLive && (
                    <Box bg="red.500" px="3" py="1" borderRadius="md">
                        <Text fontSize="xs" fontWeight="bold" color="white" letterSpacing="wider">
                            LIVE{game.period ? ` · Q${game.period}` : ''}
                        </Text>
                    </Box>
                )}
                {isFinal && (
                    <Box bg="whiteAlpha.200" px="3" py="1" borderRadius="md">
                        <Text fontSize="xs" fontWeight="bold" color="whiteAlpha.700" letterSpacing="wider">
                            FINAL
                        </Text>
                    </Box>
                )}
            </Flex>

            {/* Teams */}
            <Flex px="5" pb="5" align="center" justify="space-between">
                {/* Away team */}
                <Flex direction="column" align="center" gap="2" flex="1">
                    <Box bg="whiteAlpha.100" p="3" borderRadius="lg">
                        <Image
                            src={logoSrc(game.awayTeam.teamId, league)}
                            w="72px"
                            h="72px"
                            objectFit="contain"
                        />
                    </Box>
                    <Text
                        fontSize="md"
                        fontWeight="extrabold"
                        fontStyle="italic"
                        color="white"
                        textTransform="uppercase"
                        letterSpacing="wide"
                    >
                        {game.awayTeam.teamName}
                    </Text>
                    {(isLive || isFinal) && (
                        <Text fontFamily="hydrophilia-iced" fontSize="4xl" color="white" lineHeight="1">
                            {game.awayTeam.score}
                        </Text>
                    )}
                </Flex>

                {/* Center */}
                <Flex direction="column" align="center" flex="none" px="4">
                    {isScheduled ? (
                        <>
                            <Text fontSize="xl" fontWeight="bold" color="whiteAlpha.400" letterSpacing="widest">
                                VS
                            </Text>
                            <Text fontSize="sm" color="cyan.400" fontWeight="semibold" mt="2">
                                {gameTime}
                            </Text>
                        </>
                    ) : (
                        <Text fontSize="lg" fontWeight="bold" color="whiteAlpha.400">
                            —
                        </Text>
                    )}
                </Flex>

                {/* Home team */}
                <Flex direction="column" align="center" gap="2" flex="1">
                    <Box bg="whiteAlpha.100" p="3" borderRadius="lg">
                        <Image
                            src={logoSrc(game.homeTeam.teamId, league)}
                            w="72px"
                            h="72px"
                            objectFit="contain"
                        />
                    </Box>
                    <Text
                        fontSize="md"
                        fontWeight="extrabold"
                        fontStyle="italic"
                        color="white"
                        textTransform="uppercase"
                        letterSpacing="wide"
                    >
                        {game.homeTeam.teamName}
                    </Text>
                    {(isLive || isFinal) && (
                        <Text fontFamily="hydrophilia-iced" fontSize="4xl" color="white" lineHeight="1">
                            {game.homeTeam.score}
                        </Text>
                    )}
                </Flex>
            </Flex>
        </Box>
    );
}
