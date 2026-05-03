import {
    Box,
    Flex,
    HStack,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tooltip,
    Tr,
} from '@chakra-ui/react';
import { getMainColor, getSecondaryColor } from 'nba-color';

import { hasTripleDouble, tripleDoubleWatch, getTrueShootingPercentage } from '../util/statFunctions';
import { getLeague } from '../util/league';
import PlayerImage from './common/PlayerImage';

function EmojiBadge({ emoji, label }) {
    return (
        <Tooltip label={label} aria-label={label}>
            <span>{emoji}</span>
        </Tooltip>
    );
}

function getEmojisForStats(stats, period, teamMargin) {
    const badges = [];

    if (stats.points >= 30) {
        badges.push(<EmojiBadge key="pts-hi" emoji="🚀" label={`${stats.points} points`} />);
    } else if (stats.points >= 20) {
        badges.push(<EmojiBadge key="pts-mid" emoji="📈" label={`${stats.points} points`} />);
    }

    if (stats.threePointersMade > 4) {
        badges.push(<EmojiBadge key="3pt" emoji="💦" label={`${stats.threePointersMade} 3PT made`} />);
    }

    if (stats.assists >= 8) {
        badges.push(<EmojiBadge key="ast" emoji="🤝" label={`${stats.assists} assists`} />);
    }

    if (stats.reboundsTotal >= 8) {
        badges.push(<EmojiBadge key="reb" emoji="💪" label={`${stats.reboundsTotal} rebounds`} />);
    }

    if (stats.foulsPersonal >= period + 1 || stats.foulsPersonal >= 4 || stats.foulsTechnical > 0) {
        badges.push(<EmojiBadge key="foul" emoji="🚨" label={`Foul trouble – ${stats.foulsPersonal} fouls, ${stats.foulsTechnical} technical`} />);
    }

    if (stats.turnovers > 5) {
        badges.push(<EmojiBadge key="to" emoji="😵‍💫" label={`${stats.turnovers} turnovers`} />);
    }

    const ts = getTrueShootingPercentage(stats);
    if (stats.fieldGoalsAttempted > 3 && ts > 0.6) {
        badges.push(<EmojiBadge key="hot" emoji="🔥" label={`${Math.round(ts * 100)}% True Shooting`} />);
    }
    if (stats.fieldGoalsAttempted > 3 && ts < 0.45) {
        badges.push(<EmojiBadge key="cold" emoji="🧊" label={`${Math.round(ts * 100)}% True Shooting`} />);
    }

    if (stats.blocks + stats.steals >= 4) {
        badges.push(<EmojiBadge key="def" emoji="🔒" label={`${stats.blocks} blocks + ${stats.steals} steals`} />);
    }

    if (hasTripleDouble(stats)) {
        badges.push(<EmojiBadge key="td" emoji="📊" label="Triple double" />);
    } else if (tripleDoubleWatch(stats)) {
        badges.push(<EmojiBadge key="tdw" emoji="👀" label="Triple double watch" />);
    }

    if (stats.plusMinusPoints > 5 && stats.plusMinusPoints > teamMargin + 3) {
        badges.push(<EmojiBadge key="pm-hi" emoji="🔺" label={`+${stats.plusMinusPoints} in a ${teamMargin} point game`} />);
    }
    if (stats.plusMinusPoints < -5 && stats.plusMinusPoints < teamMargin - 3) {
        badges.push(<EmojiBadge key="pm-lo" emoji="🔻" label={`${stats.plusMinusPoints} in a ${teamMargin} point game`} />);
    }

    return badges;
}

const thProps = {
    color: 'fgDim',
    fontSize: 'sm',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    fontWeight: 'medium',
    px: '4',
    py: '3',
    bg: 'surface',
};

export default function OnCourtPlayers({ gameData, isHome }) {
    const league = getLeague(gameData.gameId);
    const team = isHome ? gameData.homeTeam : gameData.awayTeam;
    const otherTeam = isHome ? gameData.awayTeam : gameData.homeTeam;
    const onCourtPlayers = team.onCourtPlayers;
    const mainColor = getMainColor(team.teamTricode)?.hex ?? '#1d4ed8';
    const secondaryColor = getSecondaryColor(team.teamTricode)?.hex ?? mainColor;
    const teamMargin = (team.score ?? 0) - (otherTeam.score ?? 0);

    return (
        <Box
            position="relative"
            bg="bgRaised"
            border="1px solid"
            borderColor="line"
            borderRadius="lg"
            overflow="hidden"
            flex="1"
            boxShadow="0 20px 40px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.03)"
        >
            <Box position="absolute" left="0" top="0" bottom="0" w="4px" bg={mainColor} />

            {/* Header */}
            <Flex
                px="5"
                py="4"
                bgGradient={`linear(to-r, ${mainColor}44, transparent)`}
                align="center"
            >
                <Text
                    fontSize="md"
                    fontWeight="bold"
                    letterSpacing="0.12em"
                    textTransform="uppercase"
                    color={secondaryColor}
                >
                    {team.teamName} · On Court
                </Text>
            </Flex>

            <Table variant="unstyled" size="sm">
                <Thead>
                    <Tr>
                        <Th {...thProps} textAlign="left">Player</Th>
                        <Th {...thProps} isNumeric>PTS</Th>
                        <Th {...thProps} isNumeric>REB</Th>
                        <Th {...thProps} isNumeric>AST</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {onCourtPlayers.map((player) => {
                        const emojis = player.stats
                            ? getEmojisForStats(player.stats, gameData.period ?? 1, teamMargin)
                            : [];
                        return (
                            <Tr key={player.playerId}>
                                <Td
                                    px="4"
                                    py="1.5"
                                    borderBottom="1px solid"
                                    borderColor="line"
                                >
                                    <Flex align="center" gap="3">
                                        <Box w="64px" flexShrink={0} overflow="hidden">
                                            <PlayerImage league={league} playerId={player.playerId} />
                                        </Box>
                                        <Box minW="0">
                                            <Text
                                                fontSize="sm"
                                                fontWeight="bold"
                                                letterSpacing="0.06em"
                                                textTransform="uppercase"
                                                color="fg"
                                                lineHeight="tight"
                                            >
                                                {player.name}
                                                <Text
                                                    as="span"
                                                    color="fgDim"
                                                    fontWeight="normal"
                                                    ml="1.5"
                                                >
                                                    #{player.jerseyNum}
                                                </Text>
                                            </Text>
                                            {emojis.length > 0 && (
                                                <HStack mt="1.5" spacing="1" flexWrap="wrap">
                                                    {emojis}
                                                </HStack>
                                            )}
                                        </Box>
                                    </Flex>
                                </Td>
                                <Td isNumeric px="4" py="1.5" color="fg" fontSize="lg" fontWeight="semibold" borderBottom="1px solid" borderColor="line">
                                    {player.stats?.points ?? '–'}
                                </Td>
                                <Td isNumeric px="4" py="1.5" color="fg" fontSize="lg" borderBottom="1px solid" borderColor="line">
                                    {player.stats?.reboundsTotal ?? '–'}
                                </Td>
                                <Td isNumeric px="4" py="1.5" color="fg" fontSize="lg" borderBottom="1px solid" borderColor="line">
                                    {player.stats?.assists ?? '–'}
                                </Td>
                            </Tr>
                        );
                    })}
                </Tbody>
            </Table>
        </Box>
    );
}
