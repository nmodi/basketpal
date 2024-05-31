import {
    Flex,
    Heading,
} from '@chakra-ui/react';
import ScoreBreakdown from './ScoreBreakdown';

import TeamScore from './TeamScore';

export default function Scoreboard({ gameData }) {
    const { homeTeam, awayTeam } = gameData;

    return (
        <Flex mb="2" width="100%">
            <TeamScore isHome gameData={gameData} />

            <Flex 
                direction="column" 
                align="center" 
                mt="3"
            >
                <Heading fontSize="2xl">{gameData.gameStatusText}</Heading>
                <ScoreBreakdown gameData={gameData} />
            </Flex>

            <TeamScore gameData={gameData} />
        </Flex>
    );
}
