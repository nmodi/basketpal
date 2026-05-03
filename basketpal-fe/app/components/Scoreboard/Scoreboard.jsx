import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import { getTeamStyle } from '../../util/teamColorStrategy';
import ScoreBreakdown from './ScoreBreakdown';
import TeamScore from './TeamScore';

function formatGameClock(gameClock) {
    if (!gameClock) return null;
    const match = /^PT(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(gameClock);
    if (!match) return null;
    const minutes = Number.parseInt(match[1] ?? '0', 10);
    const seconds = Math.floor(Number.parseFloat(match[2] ?? '0'));
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getPeriodLabel(period) {
    if (!period) return null;
    const labels = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter', 'Overtime'];
    return labels[period - 1] ?? `${period - 4}OT`;
}

function getScoreColor(teamScore, otherTeamScore, isFinal) {
    if (!isFinal) return 'chyronFg';
    if (teamScore == null || otherTeamScore == null) return 'chyronFg';
    if (teamScore > otherTeamScore) return 'highlight';
    if (teamScore < otherTeamScore) return 'fgMuted';
    return 'chyronFg';
}

export default function Scoreboard({ gameData }) {
    const isLive = gameData.gameStatus === 2;
    const isFinal = gameData.gameStatus === 3;
    const formattedClock = formatGameClock(gameData.gameClock);

    const homeMainColor = getTeamStyle(gameData.homeTeam.teamTricode).barColor;
    const awayMainColor = getTeamStyle(gameData.awayTeam.teamTricode).barColor;

    const homeScoreColor = getScoreColor(gameData.homeTeam.score, gameData.awayTeam.score, isFinal);
    const awayScoreColor = getScoreColor(gameData.awayTeam.score, gameData.homeTeam.score, isFinal);

    return (
        <Box
            position="relative"
            bg="bgRaised"
            border="1px solid"
            borderColor="line"
            borderRadius="lg"
            overflow="hidden"
            w="90%"
            mx="auto"
            boxShadow="0 20px 40px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.03)"
            mt="6"
            mb="4"
        >
            <Flex position="relative" overflow="hidden">
                <Box position="absolute" left="0" top="0" bottom="0" w="4px" bg={homeMainColor} />
                <Box position="absolute" right="0" top="0" bottom="0" w="4px" bg={awayMainColor} />
                <TeamScore
                    team={gameData.homeTeam}
                    align="left"
                    isHome
                    isLive={isLive}
                    scoreColor={homeScoreColor}
                />

                <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    flex="0 0 20%"
                    px={{ base: '4', md: '5' }}
                    py={{ base: '4', md: '5' }}
                    borderLeft="1px solid"
                    borderRight="1px solid"
                    borderColor="line"
                    bg="bgSunken"
                >
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
                            <Text
                                mt="4"
                                fontFamily="tt-autonomous-mono"
                                fontSize={{ base: '3.5rem', md: '4.5rem' }}
                                color="live400"
                                lineHeight="1"
                                letterSpacing="0.04em"
                            >
                                {formattedClock ?? '—'}
                            </Text>
                            <Text
                                mt="2"
                                fontSize="sm"
                                color="fgMuted"
                                letterSpacing="0.14em"
                                textTransform="uppercase"
                            >
                                {getPeriodLabel(gameData.period) ?? '—'}
                            </Text>
                        </>
                    )}

                    {isFinal && (
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
                    )}
                </Flex>

                <TeamScore
                    team={gameData.awayTeam}
                    align="right"
                    isLive={isLive}
                    scoreColor={awayScoreColor}
                />
            </Flex>

            <ScoreBreakdown gameData={gameData} />
        </Box>
    );
}
