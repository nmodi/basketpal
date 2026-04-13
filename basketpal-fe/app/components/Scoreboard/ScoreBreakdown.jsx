import {
    Flex,
    Heading,
    Text,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Image,
    HStack,
} from '@chakra-ui/react';

import { getLeague } from "../../util/league"
import TeamIcon from '../common/TeamIcon';

export default function ScoreBreakdown({ gameData }) {
    const { homeTeam, awayTeam } = gameData;

    const homeTeamScores = homeTeam.periodScores;
    const awayTeamScores = awayTeam.periodScores;

    const league = getLeague(gameData.gameId);

    return (
        <TableContainer m="4">
            <Table size="sm">
                <Thead>
                    <Tr>
                        <Th>Team</Th>
                        <Th>1</Th>
                        <Th>2</Th>
                        <Th>3</Th>
                        <Th>4</Th>
                        <Th>Total</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    <Tr>
                        <Td>
                            <HStack>
                                <TeamIcon teamId={homeTeam.teamId} league={league} />
                                <span>{homeTeam.teamTricode}</span>
                            </HStack>
                        </Td>
                        {homeTeamScores?.map((s, i) => (
                            <Td key={i}>{s}</Td>
                        ))}
                        <Td>{homeTeamScores.reduce((acc, curr) => acc + curr, 0)}</Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <HStack>
                            <TeamIcon teamId={awayTeam.teamId} league={league} />
                                <span>{awayTeam.teamTricode}</span>
                            </HStack>    
                        </Td>
                        {awayTeamScores?.map((s, i) => (
                            <Td key={i}>{s}</Td>
                        ))}
                        <Td>{awayTeamScores.reduce((acc, curr) => acc + curr, 0)}</Td>
                    </Tr>
                </Tbody>
            </Table>
        </TableContainer>
    );
}
