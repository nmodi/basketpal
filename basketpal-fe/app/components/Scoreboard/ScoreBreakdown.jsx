import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    HStack,
    Text,
} from '@chakra-ui/react';

import { getLeague } from '../../util/league';
import TeamIcon from '../common/TeamIcon';

function periodScore(scores, index) {
    if (index >= scores.length) return '–';
    return scores[index];
}

function otScore(scores) {
    if (scores.length <= 4) return '–';
    return scores.slice(4).reduce((a, b) => a + b, 0);
}

export default function ScoreBreakdown({ gameData }) {
    const { homeTeam, awayTeam } = gameData;
    const league = getLeague(gameData.gameId);

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

    return (
        <TableContainer borderTop="1px solid" borderTopColor="line">
            <Table size="sm" variant="unstyled">
                <Thead>
                    <Tr>
                        <Th {...thProps} textAlign="left">Team</Th>
                        <Th {...thProps} isNumeric>Q1</Th>
                        <Th {...thProps} isNumeric>Q2</Th>
                        <Th {...thProps} isNumeric>Q3</Th>
                        <Th {...thProps} isNumeric>Q4</Th>
                        <Th {...thProps} isNumeric>OT</Th>
                        <Th {...thProps} isNumeric>Total</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {[homeTeam, awayTeam].map((team) => {
                        const total = team.score ?? team.periodScores.reduce((a, b) => a + b, 0);
                        return (
                            <Tr key={team.teamId}>
                                <Td px="4" py="3" bg="bgSunken">
                                    <HStack spacing="2">
                                        <TeamIcon teamId={team.teamId} league={league} />
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
                                            fontSize="md"
                                            fontWeight="medium"
                                            color="fg"
                                            letterSpacing="0.04em"
                                            textTransform="uppercase"
                                        >
                                            {team.teamName}
                                        </Text>
                                    </HStack>
                                </Td>
                                {[0, 1, 2, 3].map((i) => (
                                    <Td key={i} isNumeric px="4" py="3" color="fgMuted" fontSize="md" bg="bgSunken">
                                        {periodScore(team.periodScores, i)}
                                    </Td>
                                ))}
                                <Td isNumeric px="4" py="3" color="fgMuted" fontSize="md" bg="bgSunken">
                                    {otScore(team.periodScores)}
                                </Td>
                                <Td isNumeric px="4" py="3" color="fg" fontSize="xl" fontWeight="bold" bg="surface2">
                                    {total}
                                </Td>
                            </Tr>
                        );
                    })}
                </Tbody>
            </Table>
        </TableContainer>
    );
}
