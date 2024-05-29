import { Flex, Text } from '@chakra-ui/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';



export default function GamePreview({gameData}) {
    dayjs.extend(relativeTime)

    const gameTime = dayjs().isAfter(dayjs(gameData.gameTimeUTC)) ?
        "any minute now..." 
        : dayjs(gameData.gameTimeUTC).fromNow(); 

    return (
        <Flex direction="column" align="center">
            <Text fontSize="xl">Game starts {gameTime}</Text>
        </Flex>
    );
}