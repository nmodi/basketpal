import {
    Flex,
    Heading,
} from '@chakra-ui/react';
import ScoreBreakdown from './ScoreBreakdown';

import TeamScore from './TeamScore';

export default function Scoreboard({ gameData }) {
    const { homeTeam, awayTeam } = gameData;

    return (
        <Flex mb="4" width="100%">
            <TeamScore isHome gameData={gameData} />

            <Flex direction="column" align="center" mt="12">
                <Heading>{gameData.gameStatusText}</Heading>
                <ScoreBreakdown gameData={gameData} />
            </Flex>

            <TeamScore gameData={gameData} />
        </Flex>
    );
}
