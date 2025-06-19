import { Flex, Text } from '@chakra-ui/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';



export default function GamePreview({gameData}) {
    dayjs.extend(relativeTime)

    let isScheduled = true;
    if (dayjs(gameData.gameTimeUTC).unix() < 0) {
        isScheduled = false;
    }

    const gameTime = dayjs().isAfter(dayjs(gameData.gameTimeUTC)) ?
        "any minute now..." 
        : dayjs(gameData.gameTimeUTC).fromNow(); 

    return (
        <Flex direction="column" align="center">
            {isScheduled ? (
                <Text fontSize="xl">Game starts {gameTime}</Text>
            ) : (
                <Text fontSize="xl">Game is not officially scheduled</Text>
            )}
        </Flex>
    );
}