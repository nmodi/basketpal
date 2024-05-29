import {
    Table,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Image,
    HStack,
} from '@chakra-ui/react';


export default function TeamStatsComparison({gameData}) {

    const {awayTeam, homeTeam} = gameData;

    const homeStats = homeTeam.statistics; 
    const awayStats = awayTeam.statistics; 

    return (
        <TableContainer w="40%" fontSize="large">
            <Table>
                <Tbody>
                    <Tr>
                        <Th></Th>
                        <Td>                            
                            <HStack>
                                <Image
                                    src={`https://cdn.nba.com/logos/nba/${homeTeam.teamId}/primary/L/logo.svg`}
                                    w="32px"
                                />
                                <span>{homeTeam.teamTricode}</span>
                            </HStack>   
                        </Td>
                        <Td>
                            <HStack>
                                <Image
                                    src={`https://cdn.nba.com/logos/nba/${awayTeam.teamId}/primary/L/logo.svg`}
                                    w="32px"
                                />
                                <span>{awayTeam.teamTricode}</span>
                            </HStack>   
                        </Td>
                    </Tr>
                    <Tr>
                        <Th>Offensive Rebounds</Th>
                        <Td>{homeStats.reboundsOffensive}</Td>
                        <Td>{awayStats.reboundsOffensive}</Td>
                    </Tr>
                    <Tr>
                        <Th>Rebounds</Th>
                        <Td>{homeStats.reboundsTotal}</Td>
                        <Td>{awayStats.reboundsTotal}</Td>
                    </Tr>
                    <Tr>
                        <Th>Assists</Th>
                        <Td>{homeStats.assists}</Td>
                        <Td>{awayStats.assists}</Td>
                    </Tr>
                    <Tr>
                        <Th>Blocks</Th>
                        <Td>{homeStats.blocks}</Td>
                        <Td>{awayStats.blocks}</Td>
                    </Tr>
                    <Tr>
                        <Th>Steals</Th>
                        <Td>{homeStats.steals}</Td>
                        <Td>{awayStats.steals}</Td>
                    </Tr>
                    <Tr>
                        <Th>Turnovers</Th>
                        <Td>{homeStats.turnovers}</Td>
                        <Td>{awayStats.turnovers}</Td>
                    </Tr>
                    <Tr>
                        <Th>Shooting</Th>
                        <Td>{homeStats.fieldGoalsMade} / {homeStats.fieldGoalsAttempted} ({Math.round(homeStats.fieldGoalsPercentage * 100)}%) </Td>
                        
                        <Td>{awayStats.fieldGoalsMade} / {awayStats.fieldGoalsAttempted} ({Math.round(awayStats.fieldGoalsPercentage * 100)}%) </Td>
                    </Tr>
                    <Tr>
                        <Th>Free Throws</Th>
                        <Td>{homeStats.freeThrowsMade} / {homeStats.freeThrowsAttempted} ({Math.round(homeStats.freeThrowsPercentage * 100)}%) </Td>
                        
                        <Td>{awayStats.freeThrowsMade} / {awayStats.freeThrowsAttempted} ({Math.round(awayStats.freeThrowsPercentage * 100)}%) </Td>
                    </Tr>
                    <Tr>
                        <Th>3PT Shooting</Th>
                        <Td>{homeStats.threePointersMade} / {homeStats.threePointersAttempted} ({Math.round(homeStats.threePointersPercentage * 100)}%) </Td>
                        
                        <Td>{awayStats.threePointersMade} / {awayStats.threePointersAttempted} ({Math.round(awayStats.threePointersPercentage * 100)}%) </Td>
                    </Tr>
                    <Tr>
                        <Th>Bench Points</Th>
                        <Td>{homeStats.benchPoints}</Td>
                        <Td>{awayStats.benchPoints}</Td>
                    </Tr>
                    <Tr>
                        <Th>Biggest Lead</Th>
                        <Td>{homeStats.biggestLead}</Td>
                        <Td>{awayStats.biggestLead}</Td>
                    </Tr>
                    <Tr>
                        <Th>Bench Points</Th>
                        <Td>{homeStats.benchPoints}</Td>
                        <Td>{awayStats.benchPoints}</Td>
                    </Tr>
                    <Tr>
                        <Th>Points in the Paint</Th>
                        <Td>{homeStats.pointsInThePaint}</Td>
                        <Td>{awayStats.pointsInThePaint}</Td>
                    </Tr>
                </Tbody>
            </Table>
        </TableContainer>
    ); 
}