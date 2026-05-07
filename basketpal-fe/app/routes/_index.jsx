import { useState, useRef, useEffect } from 'react';
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
    const startDate = dayjs().subtract(3, 'day').format('YYYY-MM-DD');
    const endDate = dayjs().add(10, 'day').format('YYYY-MM-DD');
    const response = await axios.get(`/games/upcoming?start_date=${startDate}&end_date=${endDate}`);
    return json(response.data);
};

function DateBar({ gameDates, selectedDate, onSelectDate }) {
    const scrollRef = useRef(null);
    const todayRef = useRef(null);

    const todayStr = dayjs().format('YYYY-MM-DD');
    const dates = Array.from({ length: 14 }, (_, i) => dayjs().add(i - 3, 'day'));

    const datesWithGames = new Set(
        (gameDates || []).map(({ gameDate }) => dayjs(gameDate).format('YYYY-MM-DD'))
    );

    useEffect(() => {
        if (todayRef.current && scrollRef.current) {
            const container = scrollRef.current;
            const el = todayRef.current;
            container.scrollLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
        }
    }, []);

    return (
        <Box
            position="fixed"
            top="48px"
            left={0}
            right={0}
            zIndex={99}
            bg="bg"
            borderBottom="1px solid"
            borderColor="line"
        >
            <Box
                ref={scrollRef}
                overflowX="auto"
                sx={{
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                <Flex px="3" py="2" gap="1" display="inline-flex">
                    {dates.map(d => {
                        const dateStr = d.format('YYYY-MM-DD');
                        const isToday = dateStr === todayStr;
                        const isSelected = dateStr === selectedDate;
                        const hasGames = datesWithGames.has(dateStr);

                        return (
                            <Box
                                key={dateStr}
                                ref={isToday ? todayRef : undefined}
                                onClick={() => onSelectDate(dateStr)}
                                cursor="pointer"
                                px="3"
                                py="2"
                                borderRadius="6px"
                                bg={isSelected ? 'fg' : 'transparent'}
                                textAlign="center"
                                w="52px"
                                userSelect="none"
                                _hover={{ bg: isSelected ? 'fg' : 'surface' }}
                                transition="background 0.12s"
                            >
                                <Text
                                    fontSize="9px"
                                    fontWeight="bold"
                                    letterSpacing="0.08em"
                                    fontFamily="tt-autonomous-mono"
                                    color={isSelected ? 'bg' : 'fgDim'}
                                    lineHeight="1"
                                >
                                    {d.format('ddd').toUpperCase()}
                                </Text>
                                <Text
                                    fontSize="md"
                                    fontWeight="bold"
                                    color={isSelected ? 'bg' : 'fg'}
                                    lineHeight="1.3"
                                    mt="1"
                                >
                                    {d.format('D')}
                                </Text>
                                <Box h="6px" display="flex" alignItems="center" justifyContent="center" mt="1">
                                    {hasGames && (
                                        <Box
                                            w="4px"
                                            h="4px"
                                            borderRadius="full"
                                            bg={isSelected ? 'bg' : 'fgDim'}
                                        />
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                </Flex>
            </Box>
        </Box>
    );
}

export default function Index() {
    const data = useLoaderData();
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

    const visibleGames = (data || []).filter(({ gameDate }) =>
        dayjs(gameDate).format('YYYY-MM-DD') === selectedDate
    );

    return (
        <Flex
            direction="column"
            align="center"
            w="100%"
            minH="100vh"
            bg="bg"
            px="3"
            pb="12"
            pt="112px"
        >
            <ScheduleHeader />
            <DateBar gameDates={data} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            {visibleGames.length === 0 ? (
                <Box mt="16" textAlign="center">
                    <Text fontSize="sm" color="fgDim" letterSpacing="wide">
                        No games scheduled
                    </Text>
                </Box>
            ) : (
                visibleGames.map(({ gameDate, games }) => (
                    <Box key={gameDate} w="100%" maxW="480px" mt="6">
                        {games.map(g => (
                            <Microtron key={g.gameId} game={g} />
                        ))}
                    </Box>
                ))
            )}
        </Flex>
    );
}
