import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import { useNavigate } from "@remix-run/react";
import dayjs from 'dayjs';
import { getTeamStyle } from '../util/teamColorStrategy';

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

function TeamPanel({ team, align, isScheduled, scoreColor, scoreOpacity, teamStyle }) {
    const isRight = align === 'right';
    const dir = isRight ? 'left' : 'right';

    return (
        <Flex
            direction="column"
            justify="flex-start"
            align={isRight ? 'flex-end' : 'flex-start'}
            textAlign={isRight ? 'right' : 'left'}
            flex="1"
            minW="0"
            position="relative"
            overflow="hidden"
            px={{ base: '3', md: '5' }}
            py={{ base: '3', md: '4' }}
            bg="surface"
            boxShadow="inset 0 1px 0 rgba(255,255,255,0.03)"
        >
            <Box
                position="absolute"
                inset="0"
                pointerEvents="none"
                style={{ background: teamStyle.getGradient(dir) }}
            />

            <Box position="relative">
                <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color="fgMuted"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                >
                    {team.teamTricode}
                </Text>
                <Text
                    mt="1"
                    fontFamily="monte-stella"
                    fontSize={{ base: 'xl', md: '2xl' }}
                    fontWeight="black"
                    lineHeight="0.95"
                    letterSpacing="0.07em"
                    textTransform="uppercase"
                    color={teamStyle.nameColor}
                    noOfLines={1}
                >
                    {team.teamName}
                </Text>
            </Box>

            {isScheduled ? (
                <Text
                    position="relative"
                    mt="3"
                    fontFamily="tt-autonomous-mono"
                    fontSize={{ base: '2.5rem', md: '3rem' }}
                    lineHeight="0.82"
                    color={scoreColor}
                    opacity="0.7"
                >
                    —
                </Text>
            ) : (
                <Box
                    position="relative"
                    mt="3"
                    bg="bgSunken"
                    borderRadius="md"
                    px="2"
                    py="1"
                    border="1px solid"
                    borderColor="lineStrong"
                    width="fit-content"
                    alignSelf={isRight ? 'flex-end' : 'flex-start'}
                >
                    <Text
                        fontFamily="tt-autonomous-mono"
                        fontSize={{ base: '2.5rem', md: '3rem' }}
                        lineHeight="0.9"
                        color={scoreColor}
                        opacity={scoreOpacity}
                    >
                        {team.score ?? '--'}
                    </Text>
                </Box>
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
    const awayStyle = getTeamStyle(game.awayTeam.teamTricode);
    const homeStyle = getTeamStyle(game.homeTeam.teamTricode);
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
            mb="2"
        >
            <Box position="absolute" left="0" top="0" bottom="0" w="4px" bg={homeStyle.barColor} zIndex={1} />
            <Box position="absolute" right="0" top="0" bottom="0" w="4px" bg={awayStyle.barColor} zIndex={1} />

            <Flex minH={{ base: '110px', md: '120px' }}>
                <TeamPanel
                    team={game.homeTeam}
                    align="left"
                    isScheduled={isScheduled}
                    scoreColor={homeScoreColor}
                    scoreOpacity={homeScoreOpacity}
                    teamStyle={homeStyle}
                />

                <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    flex="0 0 28%"
                    px={{ base: '2', md: '3' }}
                    py={{ base: '3', md: '4' }}
                    borderLeft="1px solid"
                    borderRight="1px solid"
                    borderColor="line"
                    bg="bgSunken"
                >
                    {isScheduled && (
                        <>
                            <Text
                                fontFamily="tt-autonomous-mono"
                                fontSize={{ base: 'lg', md: 'xl' }}
                                color="fg"
                            >
                                {gameTime.replace(/\s?(AM|PM)$/i, ' ET')}
                            </Text>
                            <Text
                                mt="2"
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
                                px="3"
                                py="0.5"
                                borderRadius="sm"
                                fontSize="xs"
                                letterSpacing="0.16em"
                            >
                                LIVE
                            </Badge>
                            <Flex
                                mt="3"
                                align="center"
                                gap="2"
                                fontFamily="tt-autonomous-mono"
                                fontSize={{ base: 'lg', md: 'xl' }}
                                color="live400"
                                lineHeight="1"
                            >
                                <Text>Q{game.period ?? '-'}</Text>
                                <Text fontSize="sm" transform="translateY(-1px)">•</Text>
                                <Text>{formattedClock ?? 'LIVE'}</Text>
                            </Flex>
                        </>
                    )}

                    {isFinal && (
                        <>
                            <Box
                                px="3"
                                py="1"
                                border="1px solid"
                                borderColor="lineStrong"
                                borderRadius="sm"
                            >
                                <Text
                                    fontSize="xs"
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
                    team={game.awayTeam}
                    align="right"
                    isScheduled={isScheduled}
                    scoreColor={awayScoreColor}
                    scoreOpacity={awayScoreOpacity}
                    teamStyle={awayStyle}
                />
            </Flex>
        </Box>
    );
}
