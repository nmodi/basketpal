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

export default function TeamStatsComparison({
    leftTeam,
    rightTeam,
    leftTeamStats = leftTeam.statistics,
    rightTeamStats = rightTeam.statistics
}) {

    const gameStatRows = [
        {
            title: "Offensive Rebounds",
            statKeys: ['reboundsOffensive'],
            statFunction: (stats) => ({
                formatted: stats.reboundsOffensive,
                value: stats.reboundsOffensive
            })
        },
        {
            title: "Rebounds",
            statKeys: ['reboundsTotal'],
            statFunction: (stats) => ({
                formatted: stats.reboundsTotal,
                value: stats.reboundsTotal
            })
        },
        {
            title: "Assists",
            statKeys: ['assists'],
            statFunction: (stats) => ({
                formatted: stats.assists,
                value: stats.assists
            })
        },
        {
            title: "Blocks",
            statKeys: ['blocks'],
            statFunction: (stats) => ({
                formatted: stats.blocks,
                value: stats.blocks
            })
        },
        {
            title: "Steals",
            statKeys: ['steals'],
            statFunction: (stats) => ({
                formatted: stats.steals,
                value: stats.steals
            })
        },
        {
            title: "Turnovers",
            statKeys: ['turnovers'],
            isPositiveStat: false,
            statFunction: (stats) => ({
                formatted: stats.turnovers,
                value: stats.turnovers
            })
        },
        {
            title: "Shooting",
            statKeys: ['fieldGoalsMade', 'fieldGoalsAttempted'],
            statFunction: (stats) => {
                const made = stats.fieldGoalsMade;
                const attempted = stats.fieldGoalsAttempted;
                const percentage = ((made / attempted) * 100).toFixed(1);

                return {
                    formatted: `${made} / ${attempted} (${percentage}%)`,
                    value: parseFloat(percentage)
                };
            }
        },
        {
            title: "Free Throws",
            statKeys: ['freeThrowsMade', 'freeThrowsAttempted'],
            statFunction: (stats) => {
                const made = stats.freeThrowsMade;
                const attempted = stats.freeThrowsAttempted;
                const percentage = ((made / attempted) * 100).toFixed(1);

                return {
                    formatted: `${made} / ${attempted} (${percentage}%)`,
                    value: parseFloat(percentage)
                };
            }
        },
        {
            title: "3PT Shooting",
            statKeys: ['threePointersMade', 'threePointersAttempted'],
            statFunction: (stats) => {
                const made = stats.threePointersMade;
                const attempted = stats.threePointersAttempted;
                const percentage = ((made / attempted) * 100).toFixed(1);

                return {
                    formatted: `${made} / ${attempted} (${percentage}%)`,
                    value: parseFloat(percentage)
                };
            }
        },
        {
            title: "Bench Points",
            statKeys: ['benchPoints'],
            statFunction: (stats) => ({
                value: stats.benchPoints,
                formatted: stats.benchPoints
            })
        },
        {
            title: "Biggest Lead",
            statKeys: ['biggestLead'],
            statFunction: (stats) => ({
                value: stats.biggestLead,
                formatted: stats.biggestLead
            })
        },
        {
            title: "Points in the Paint",
            statKeys: ['pointsInThePaint'],
            statFunction: (stats) => ({
                value: stats.pointsInThePaint,
                formatted: stats.pointsInThePaint
            })
        },
        {
            title: "Fast Break Points",
            statKeys: ['fastBreakPointsMade'],
            statFunction: (stats) => ({
                value: stats.fastBreakPointsMade,
                formatted: stats.fastBreakPointsMade
            })
        }
    ];

    const filteredGameStatRows = gameStatRows.filter(
        row => row.statKeys.every(key => leftTeamStats.hasOwnProperty(key) && rightTeamStats.hasOwnProperty(key))
    );

    return (
        <TableContainer fontSize="large">
            <Table>
                <Tbody>
                    <Tr>
                        <Th></Th>
                        <Td>
                            <HStack>
                                <Image
                                    src={`https://cdn.nba.com/logos/nba/${leftTeam.teamId}/primary/L/logo.svg`}
                                    w="32px"
                                />
                                <span>{leftTeam.teamTricode}</span>
                            </HStack>
                        </Td>
                        <Td>
                            <HStack>
                                <Image
                                    src={`https://cdn.nba.com/logos/nba/${rightTeam.teamId}/primary/L/logo.svg`}
                                    w="32px"
                                />
                                <span>{rightTeam.teamTricode}</span>
                            </HStack>
                        </Td>
                    </Tr>
                    {filteredGameStatRows.map((row, index) => (
                        <GameStatRow
                            key={index}
                            title={row.title}
                            leftTeamStats={leftTeamStats}
                            rightTeamStats={rightTeamStats}
                            statFunction={row.statFunction}
                            isPositiveStat={row.isPositiveStat ?? true}
                        />
                    ))}
                </Tbody>
            </Table>
        </TableContainer>
    );
}

const GameStatRow = ({ title, leftTeamStats, rightTeamStats, statFunction, isPositiveStat = true }) => {
    const homeStat = statFunction(leftTeamStats);
    const awayStat = statFunction(rightTeamStats);

    const isStatBetter = (selfStat, otherStat) => {
        if (isPositiveStat) {
            return selfStat.value > otherStat.value;
        }
        return otherStat.value > selfStat.value;
    }

    const getColor = (selfStat, otherStat) => {
        return isStatBetter(selfStat, otherStat) ? 'yellow.400' : '';
    }

    const getBold = (selfStat, otherStat) => {
        return isStatBetter(selfStat, otherStat) ? 'bold' : '';
    }

    return (
        <Tr>
            <Th>{title}</Th>
            <Td
                color={getColor(homeStat, awayStat)}
                fontWeight={getBold(homeStat, awayStat)}
            >
                {homeStat.formatted}
            </Td>
            <Td
                color={getColor(awayStat, homeStat)}
                fontWeight={getBold(awayStat, homeStat)}
            >
                {awayStat.formatted}
            </Td>
        </Tr>
    );
};
