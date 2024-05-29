import {
    Flex,
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Image,
    Text,
    Tooltip,
    HStack,
} from '@chakra-ui/react';

export default function OnCourtPlayers({ gameData, isHome }) {

    const team = isHome ? gameData.homeTeam : gameData.awayTeam;
    const otherTeam = isHome ? gameData.awayTeam : gameData.homeTeam;

    const onCourtPlayers = team.players
        ? team.players.filter((player) => player.oncourt === '1')
        : [];


    const getEmojiWithTooltip = (emoji, tooltip) => (
        <Tooltip label={tooltip} aria-label={tooltip} key={tooltip}>
            <span>{emoji}</span>
        </Tooltip>
    );

    const getEmojisForStats = (stats) => {
        const emojis = [];

        if (stats.points >= 30) {
            emojis.push(getEmojiWithTooltip('🚀', `${stats.points} points`));
        } else if (stats.points >= 20) {
            emojis.push(getEmojiWithTooltip('📈', `${stats.points} points`));
        }

        if (stats.threePointersMade > 4) {
            emojis.push(getEmojiWithTooltip('💦', `${stats.threePointersMade} 3PT made`));
        }

        if (stats.assists >= 8) {
            emojis.push(getEmojiWithTooltip('🤝', `${stats.assists} assists`));
        }

        if (stats.reboundsTotal >= 8) {
            emojis.push(getEmojiWithTooltip('💪', `${stats.reboundsTotal} rebounds`));
        }

        if (stats.foulsPersonal >= gameData.period + 1 ||
            stats.foulsPersonal >= 4 || 
            stats.foulsTechnical > 0) {

            emojis.push(getEmojiWithTooltip('🚨', `Foul trouble - ${stats.foulsPersonal} fouls, ${stats.foulsTechnical} technical fouls`));
        }

        if (stats.turnovers > 5) {
            emojis.push(getEmojiWithTooltip('😵‍💫', `${stats.turnovers} turnovers`));
        }

        if (stats.fieldGoalsAttempted > 3 && getTrueShootingPercentage(stats) > 0.6) {
            emojis.push(getEmojiWithTooltip('🔥', `${Math.round(getTrueShootingPercentage(stats) * 100)}% True Shooting Percentage`));
        }

        if (stats.fieldGoalsAttempted > 3 && getTrueShootingPercentage(stats) < 0.45) {
            emojis.push(getEmojiWithTooltip('🧊', `${Math.round(getTrueShootingPercentage(stats) * 100)}% True Shooting Percentage`));
        }

        if ((stats.blocks + stats.steals) >= 4) {
            emojis.push(getEmojiWithTooltip('🔒', `${(stats.blocks)} blocks + ${stats.steals} steals`));
        }

        if (hasTripleDouble(stats)) {
            emojis.push(getEmojiWithTooltip('📊', `Triple double`));
        } else if (tripleDoubleWatch(stats)) {
            emojis.push(getEmojiWithTooltip('👀', `Triple double watch`));
        }

        let teamMargin = team.score  - otherTeam.score;

        if (stats.plusMinusPoints > 5 && stats.plusMinusPoints > teamMargin + 3) {
            emojis.push(getEmojiWithTooltip('🔺', `+${stats.plusMinusPoints} in a ${teamMargin} point game`));
        }

        if (stats.plusMinusPoints < -5 && stats.plusMinusPoints < teamMargin - 3) {
            emojis.push(getEmojiWithTooltip('🔻', `${stats.plusMinusPoints} in a ${teamMargin} point game`));
        }

        return emojis;
    };

    return (
        <Flex direction="column" w="40%">
            <TableContainer h="100%" fontSize="xl">
                <Table variant="simple" h="100%">
                    <Thead>
                        <Tr>
                            <Th></Th>
                            <Th>On Court</Th>
                            <Th isNumeric>PTS</Th>
                            <Th isNumeric>REB</Th>
                            <Th isNumeric>AST</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {onCourtPlayers.map((player) => (
                            <Tr key={player.personId} height="77px">
                                <Td w="100px" p="0">
                                    <Image
                                        src={`https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${player.personId}.png`}
                                        // w="100px"
                                        m="0 auto"
                                    />
                                </Td>
                                <Td>
                                    <Text
                                        as="b"
                                        casing="uppercase"
                                        fontSize="md"
                                    >
                                        {player.name}
                                    </Text>
                                    <HStack mt="1">
                                        {getEmojisForStats(player.statistics)}
                                    </HStack>
                                </Td>
                                <Td isNumeric>{player.statistics.points}</Td>
                                <Td isNumeric>
                                    {player.statistics.reboundsTotal}
                                </Td>
                                <Td isNumeric>{player.statistics.assists}</Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </TableContainer>
        </Flex>
    );
}

const hasTripleDouble = (stats) => {

    const { points, reboundsTotal, assists, steals, blocks } = stats;

    let doubleDigitCount = 0;
  
    if (points >= 10) doubleDigitCount++;
    if (reboundsTotal >= 10) doubleDigitCount++;
    if (assists >= 10) doubleDigitCount++;
    if (steals >= 10) doubleDigitCount++;
    if (blocks >= 10) doubleDigitCount++;
  
    return doubleDigitCount >= 3;
}


const tripleDoubleWatch = (stats) => {
    const { points, reboundsTotal, assists, steals, blocks } = stats;
  
    let almostDoubleCount = 0;
  
    if (points >= 8) almostDoubleCount++;
    if (reboundsTotal >= 8) almostDoubleCount++;
    if (assists >= 8) almostDoubleCount++;
    if (steals >= 8) almostDoubleCount++;
    if (blocks >= 8) almostDoubleCount++;
  
    return almostDoubleCount >= 3;
}

const getTrueShootingPercentage = (stats) => {

    const {fieldGoalsAttempted, freeThrowsAttempted, points} = stats; 

    if (fieldGoalsAttempted === 0 && freeThrowsAttempted === 0) {
        return 0;
    }

    const tsPercentage = points / (2 * (fieldGoalsAttempted + 0.44 * freeThrowsAttempted));
    return tsPercentage;
}

