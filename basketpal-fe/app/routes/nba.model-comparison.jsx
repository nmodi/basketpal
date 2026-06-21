import { useEffect, useState } from 'react';
import { json } from '@remix-run/node';
import { useLoaderData, useSearchParams } from '@remix-run/react';
import {
    Box,
    Button,
    Flex,
    Heading,
    SimpleGrid,
    Tag,
    Text,
    VStack,
} from '@chakra-ui/react';
import axios from '../util/axios';
import { toRouteError } from '../util/loaderError';

const DEFAULT_GAME_ID = '0042500401';

export const meta = () => [{ title: 'Model Comparison | Basketpal' }];

export const loader = async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId') || DEFAULT_GAME_ID;
    const refresh = searchParams.get('refresh') === 'true';

    try {
        const response = await axios.get(`/games/${gameId}/model-comparison`, {
            params: refresh ? { refresh: true } : {},
        });
        return json({ gameId, recaps: response.data });
    } catch (error) {
        throw toRouteError(error);
    }
};

const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const RecapCard = ({ recap, revealed, onToggleReveal }) => (
    <Box bg="surface" p="5" borderRadius="15px">
        <Flex justify="space-between" align="center" mb="3">
            <Heading size="md" color="fg">{recap.blindLabel}</Heading>
            <Button size="sm" onClick={onToggleReveal}>
                {revealed ? 'Hide' : 'Reveal'}
            </Button>
        </Flex>
        {revealed && (
            <Tag colorScheme="purple" mb="3">{recap.label}</Tag>
        )}

        <Heading size="sm" color="fg" mb="2">{recap.headline}</Heading>

        <Flex direction="column" gap="2">
            {(recap.recap || '').split('\n').filter(Boolean).map((p, i) => (
                <Text key={i} color="fg" whiteSpace="pre-wrap">{p}</Text>
            ))}
        </Flex>

        {recap.keyMoments?.length > 0 && (
            <VStack align="start" mt="3" spacing="1">
                {recap.keyMoments.map((moment, i) => (
                    <Text key={i} fontSize="sm" color="fgMuted">
                        Q{moment.quarter}: {moment.description}
                    </Text>
                ))}
            </VStack>
        )}

        {recap.playerOfTheGame && (
            <Text fontSize="sm" color="fgMuted" mt="3">
                POTG: {recap.playerOfTheGame.name} — {recap.playerOfTheGame.reason}
            </Text>
        )}
    </Box>
);

export default function ModelComparison() {
    const { gameId, recaps } = useLoaderData();
    const [searchParams] = useSearchParams();
    // Render the server's order first so hydration matches, then shuffle
    // client-side after mount to randomize position on every page load.
    const [shuffledRecaps, setShuffledRecaps] = useState(recaps);
    useEffect(() => {
        setShuffledRecaps(shuffle(recaps));
    }, [recaps]);
    const [revealed, setRevealed] = useState({});
    const [allRevealed, setAllRevealed] = useState(false);

    const toggleReveal = (blindLabel) => {
        setRevealed((prev) => ({ ...prev, [blindLabel]: !prev[blindLabel] }));
    };

    const toggleRevealAll = () => {
        setAllRevealed((prev) => !prev);
        setRevealed({});
    };

    const handleRefresh = () => {
        const params = new URLSearchParams(searchParams);
        params.set('refresh', 'true');
        window.location.search = params.toString();
    };

    return (
        <Box p="8">
            <Flex justify="space-between" align="center" mb="6">
                <VStack align="start" spacing="0">
                    <Heading color="fg">Model Comparison</Heading>
                    <Text color="fgMuted">Game {gameId}</Text>
                </VStack>
                <Flex gap="3">
                    <Button onClick={toggleRevealAll}>
                        {allRevealed ? 'Hide All' : 'Reveal All'}
                    </Button>
                    <Button onClick={handleRefresh} colorScheme="purple">
                        Regenerate
                    </Button>
                </Flex>
            </Flex>

            <SimpleGrid columns={{ base: 1, lg: 2 }} gap="20px">
                {shuffledRecaps.map((recap) => (
                    <RecapCard
                        key={recap.blindLabel}
                        recap={recap}
                        revealed={allRevealed || !!revealed[recap.blindLabel]}
                        onToggleReveal={() => toggleReveal(recap.blindLabel)}
                    />
                ))}
            </SimpleGrid>
        </Box>
    );
}
