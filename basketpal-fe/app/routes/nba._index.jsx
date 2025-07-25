import { Flex, Heading } from '@chakra-ui/react';
import Microtron from '../components/Microtron';
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import axios from "../util/axios";

export const meta = () => {
    return [
        { title: 'Basketpal' },
        { name: 'description', content: 'Welcome to Remix!' },
    ];
};

export const loader = async () => {
    // const response = await fetch("https://basketpal-be.onrender.com/games");
    // const response = await fetch("http://127.0.0.1:8000/games/upcoming");
    const response = await axios.get("/games/upcoming");
    const gameDates = await response.data;
    return json(gameDates);
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
            {data.map(({gameDate, games}) => (
                <>
                    <Heading>{gameDate}</Heading>
                    {games.map(g => (
                        <Microtron key={g.gameId} game={g} />
                    ))}
                </>
            ))}
        </Flex>
    );
}
