import { Flex, Heading, Text } from '@chakra-ui/react';
import { useNavigate } from "@remix-run/react";

export default function Microtron({game, selectGame}) { 

    const navigate = useNavigate();

    return (
        <Flex 
            direction="column" 
            // bg="white" 
            color="white"
            border="1px solid white"
            m="2" 
            w="40%"
            p="4" 
            onClick={() => navigate(`/nba/g/${game.gameId}`)}
            fontSize="3xl"
        >
            <Text>{game.gameStatusText}</Text>
            <Flex justify="space-around" w="100%">
                <Text fontWeight="bold">{game.homeTeam.teamTricode}</Text>
                <Text
                    fontFamily="hydrophilia-iced"
                >{game.homeTeam.score}</Text>
            </Flex>
            <Flex justify="space-around" w="100%">
                <Text fontWeight="bold">{game.awayTeam.teamTricode}</Text>
                <Text 
                    fontFamily="hydrophilia-iced"  
                >
                    {game.awayTeam.score}
                </Text>
            </Flex>
        </Flex>
    );
}