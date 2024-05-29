import { Flex } from '@chakra-ui/react';
import Microtron from '../components/Microtron';
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const meta = () => {
    return [
        { title: 'Basketpal' },
        { name: 'description', content: 'Welcome to Remix!' },
    ];
};

export const loader = async () => {
    const response = await fetch("https://basketpal-be.onrender.com/games");
    const games = await response.json();
    return json(games);
};

export default function Index() {
    const data = useLoaderData();

    return (
        <Flex
            direction="column"
            justify="flex-start"
            align="center"
            w="100%"
            h="calc(100vh)"
        >
            {data.map(game => <Microtron key={game.gameId} game={game} />)}
        </Flex>
    );
}
