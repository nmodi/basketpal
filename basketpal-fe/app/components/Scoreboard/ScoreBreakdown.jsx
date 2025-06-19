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

export default function ScoreBreakdown({ gameData }) {
    const { homeTeam, awayTeam } = gameData;

    const homeTeamScores = homeTeam.periods?.map((p) => p.score);
    const awayTeamScores = awayTeam.periods?.map((p) => p.score);

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
                                <Image
                                    src={`https://cdn.nba.com/logos/nba/${homeTeam.teamId}/primary/L/logo.svg`}
                                    w="16px"
                                />
                                <span>{homeTeam.teamTricode}</span>
                            </HStack>
                        </Td>
                        {homeTeamScores?.map((s, i) => (
                            <Td key={i}>{s}</Td>
                        ))}
                        <Td>{homeTeam.score}</Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <HStack>
                                <Image
                                    src={`https://cdn.nba.com/logos/nba/${awayTeam.teamId}/primary/L/logo.svg`}
                                    w="16px"
                                />
                                <span>{awayTeam.teamTricode}</span>
                            </HStack>    
                        </Td>
                        {awayTeamScores?.map((s, i) => (
                            <Td key={i}>{s}</Td>
                        ))}
                        <Td>{awayTeam.score}</Td>
                    </Tr>
                </Tbody>
            </Table>
        </TableContainer>
    );
}
