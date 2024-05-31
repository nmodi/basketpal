import {
    Flex,
    Image,
    Table,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Thead,
    HStack,
} from '@chakra-ui/react';
import { calculateGameScore, getTrueShootingPercentage } from '../util/statFunctions';

export default function Scoreboard({ gameData }) {

    const {homeTeam, awayTeam} = gameData; 

    const getTopPlayers = (team, N) => {
        return team.players
            .map(p => ({...p, teamId: team.teamId, gameScore: calculateGameScore(p.statistics)}))
            .sort((a, b) => b.gameScore - a.gameScore)
            .slice(0, N);
    }

    const topPlayers = getTopPlayers(homeTeam, 2).concat(getTopPlayers(awayTeam, 2))
        // .sort((a, b) => b.gameScore - a.gameScore);

    return (
        <Flex direction="column" align="center">

            Top Players
            <TableContainer>
                <Table>
                    <Thead>
                        <Tr>
                            <Th>Player</Th>
                            <Th>PTS</Th>
                            <Th>REB</Th>
                            <Th>AST</Th>
                            <Th>STL</Th>
                            <Th>BLK</Th>
                            <Th>TS%</Th>
                            <Th>GSc</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {topPlayers.map(p => (
                            <Tr key={p.personId}>
                                <Td>
                                    <HStack>
                                        <Image
                                            src={`https://cdn.nba.com/logos/nba/${p.teamId}/primary/L/logo.svg`}
                                            w="20px"
                                        />
                                        <span>{p.name}</span>
                                    </HStack>

                                </Td>
                                <Td>{p.statistics.points}</Td>
                                <Td>{p.statistics.reboundsTotal}</Td>
                                <Td>{p.statistics.assists}</Td>
                                <Td>{p.statistics.steals}</Td>
                                <Td>{p.statistics.blocks}</Td>
                                <Td>{(getTrueShootingPercentage(p.statistics) * 100).toFixed(1)}</Td>
                                <Td>{calculateGameScore(p.statistics).toFixed(1)}</Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </TableContainer>
        </Flex>
    ); 
}