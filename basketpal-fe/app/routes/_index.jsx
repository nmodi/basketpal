import { Box, Flex, Text } from '@chakra-ui/react';
import Microtron from '../components/Microtron';
import { ScheduleHeader } from '../components/Header';
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import axios from "../util/axios";
import dayjs from 'dayjs';

export const meta = () => {
    return [
        { title: 'Basketpal' },
        { name: 'description', content: 'Welcome to Remix!' },
    ];
};

export const loader = async () => {
    const response = await axios.get("/games/upcoming");
    const gameDates = await response.data;
    return json(gameDates);
};

function formatDateLabel(dateStr) {
    const d = dayjs(dateStr);
    const today = dayjs().startOf('day');
    const diff = d.startOf('day').diff(today, 'day');
    if (diff === 0) return 'TODAY';
    if (diff === 1) return 'TOMORROW';
    return d.format('dddd, MMM D').toUpperCase();
}

export default function Index() {
    const data = useLoaderData();

    return (
        <Flex
            direction="column"
            align="center"
            w="100%"
            minH="100vh"
            bg="bg"
            px="3"
            pb="12"
            pt="48px"
        >
            <ScheduleHeader />
            {data.map(({ gameDate, games }) => (
                <Box key={gameDate} w="100%" maxW="480px" mt="8">
                    <Text
                        fontSize="xs"
                        fontWeight="bold"
                        color="fgDim"
                        letterSpacing="widest"
                        textTransform="uppercase"
                        px="2"
                        mb="3"
                    >
                        {formatDateLabel(gameDate)}
                    </Text>
                    {games.map(g => (
                        <Microtron key={g.gameId} game={g} />
                    ))}
                </Box>
            ))}
        </Flex>
    );
}
