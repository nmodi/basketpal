import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import { useNavigate } from "@remix-run/react";
import dayjs from 'dayjs';
import { getMainColor } from 'nba-color';

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

function formatGameClock(gameClock) {
    if (!gameClock) return null;

    const match = /^PT(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(gameClock);
    if (!match) return null;

    const minutes = Number.parseInt(match[1] ?? '0', 10);
    const seconds = Math.floor(Number.parseFloat(match[2] ?? '0'));

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getTeamColors(teamTricode) {
    return {
        main: getMainColor(teamTricode)?.hex ?? '#1d4ed8',
    };
}

function getScoreOpacity(teamScore, otherTeamScore) {
    if (teamScore == null || otherTeamScore == null) return 1;
    if (teamScore > otherTeamScore) return 1;
    if (teamScore < otherTeamScore) return 0.45;
    return 0.7;
}

function getScoreColor(teamScore, otherTeamScore, isFinal) {
    if (!isFinal) return 'chyronFg';
    if (teamScore == null || otherTeamScore == null) return 'chyronFg';
    if (teamScore > otherTeamScore) return 'highlight';
    if (teamScore < otherTeamScore) return 'fgMuted';
    return 'chyronFg';
}

function TeamPanel({ team, align, isScheduled, scoreColor, scoreOpacity }) {
    const textAlign = align === 'right' ? 'right' : 'left';

    return (
        <Flex
            direction="column"
            justify="flex-start"
            align={align === 'right' ? 'flex-end' : 'flex-start'}
            textAlign={textAlign}
            flex="1"
            minW="0"
            px={{ base: '5', md: '7' }}
            py={{ base: '5', md: '6' }}
            bg="surface"
            boxShadow="inset 0 1px 0 rgba(255,255,255,0.03)"
        >
            <Box>
                <Text
                    fontSize="md"
                    fontWeight="bold"
                    color="fgMuted"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                >
                    {team.teamTricode}
                </Text>
                <Text
                    mt="3"
                    fontFamily="monte-stella"
                    fontSize={{ base: '3xl', md: '4xl' }}
                    fontWeight="black"
                    lineHeight="0.95"
                    letterSpacing="0.07em"
                    textTransform="uppercase"
                    color="fg"
                    noOfLines={2}
                >
                    {team.teamName}
                </Text>
            </Box>

            {isScheduled ? (
                <Text
                    mt="6"
                    fontFamily="tt-autonomous-mono"
                    fontSize={{ base: '4rem', md: '4.75rem' }}
                    lineHeight="0.82"
                    color={scoreColor}
                    opacity="0.7"
                >
                    —
                </Text>
            ) : (
                <Text
                    mt="6"
                    fontFamily="tt-autonomous-mono"
                    fontSize={{ base: '4.5rem', md: '5.5rem' }}
                    lineHeight="0.82"
                    color={scoreColor}
                    opacity={scoreOpacity}
                >
                    {team.score ?? '--'}
                </Text>
            )}
        </Flex>
    );
}

export default function Microtron({ game }) {
    const navigate = useNavigate();
    const isScheduled = game.gameStatus === 1;
    const isLive = game.gameStatus === 2;
    const isFinal = game.gameStatus === 3;
    const gameTime = dayjs(game.gameTimeUTC).format('h:mm A');
    const awayColors = getTeamColors(game.awayTeam.teamTricode);
    const homeColors = getTeamColors(game.homeTeam.teamTricode);
    const formattedClock = formatGameClock(game.gameClock);
    const awayScoreColor = getScoreColor(game.awayTeam.score, game.homeTeam.score, isFinal);
    const homeScoreColor = getScoreColor(game.homeTeam.score, game.awayTeam.score, isFinal);
    const awayScoreOpacity = isLive || isFinal ? 1 : getScoreOpacity(game.awayTeam.score, game.homeTeam.score);
    const homeScoreOpacity = isLive || isFinal ? 1 : getScoreOpacity(game.homeTeam.score, game.awayTeam.score);

    return (
        <Box
            position="relative"
            bg="bgRaised"
            border="1px solid"
            borderColor="line"
            borderRadius="lg"
            overflow="hidden"
            w="100%"
            boxShadow="0 20px 40px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.03)"
            cursor="pointer"
            onClick={() => navigate(`/nba/g/${game.gameId}`)}
            _hover={{
                borderColor: 'lineStrong',
                transform: 'translateY(-2px)',
                boxShadow: '0 24px 48px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)'
            }}
            transition="all 0.18s ease"
            mb="4"
        >
            <Box position="absolute" left="0" top="0" bottom="0" w="4px" bg={awayColors.main} />
            <Box position="absolute" right="0" top="0" bottom="0" w="4px" bg={homeColors.main} />

            <Flex minH={{ base: '164px', md: '180px' }}>
                <TeamPanel
                    team={game.awayTeam}
                    align="left"
                    isScheduled={isScheduled}
                    scoreColor={awayScoreColor}
                    scoreOpacity={awayScoreOpacity}
                />

                <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    flex="0 0 32%"
                    px={{ base: '4', md: '5' }}
                    py={{ base: '4', md: '5' }}
                    borderLeft="1px solid"
                    borderRight="1px solid"
                    borderColor="line"
                    bg="bgSunken"
                >
                    {isScheduled && (
                        <>
                            <Text
                                fontSize="md"
                                fontWeight="medium"
                                color="fgDim"
                                letterSpacing="0.16em"
                                textTransform="uppercase"
                            >
                                Tip
                            </Text>
                            <Text
                                mt="3"
                                fontFamily="tt-autonomous-mono"
                                fontSize={{ base: '2xl', md: '3xl' }}
                                color="fg"
                            >
                                {gameTime.replace(/\s?(AM|PM)$/i, ' ET')}
                            </Text>
                            <Text
                                mt="3"
                                fontSize="xs"
                                color="fgMuted"
                                letterSpacing="0.14em"
                                textAlign="center"
                                textTransform="uppercase"
                            >
                                {getCountdownLabel(game.gameTimeUTC)}
                            </Text>
                        </>
                    )}

                    {isLive && (
                        <>
                            <Badge
                                bg="live500"
                                color="fgInverse"
                                px="3.5"
                                py="1"
                                borderRadius="sm"
                                fontSize="xs"
                                letterSpacing="0.16em"
                            >
                                LIVE
                            </Badge>
                            <Flex
                                mt="6"
                                align="center"
                                gap="3"
                                fontFamily="tt-autonomous-mono"
                                fontSize={{ base: '2xl', md: '3xl' }}
                                color="live400"
                                lineHeight="1"
                            >
                                <Text>Q{game.period ?? '-'}</Text>
                                <Text fontSize="lg" transform="translateY(-1px)">•</Text>
                                <Text>{formattedClock ?? 'LIVE'}</Text>
                            </Flex>
                        </>
                    )}

                    {isFinal && (
                        <>
                            <Box
                                px="4"
                                py="1.5"
                                border="1px solid"
                                borderColor="lineStrong"
                                borderRadius="sm"
                            >
                                <Text
                                    fontSize="sm"
                                    fontWeight="medium"
                                    color="fg"
                                    letterSpacing="0.22em"
                                    textTransform="uppercase"
                                    lineHeight="1"
                                >
                                    Final
                                </Text>
                            </Box>
                        </>
                    )}
                </Flex>

                <TeamPanel
                    team={game.homeTeam}
                    align="right"
                    isScheduled={isScheduled}
                    scoreColor={homeScoreColor}
                    scoreOpacity={homeScoreOpacity}
                />
            </Flex>
        </Box>
    );
}
