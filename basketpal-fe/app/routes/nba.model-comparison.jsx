import { Suspense, useEffect, useState } from 'react';
import { defer } from '@remix-run/node';
import { Await, useLoaderData, useSearchParams } from '@remix-run/react';
import {
    Box,
    Button,
    Flex,
    Heading,
    SimpleGrid,
    Spinner,
    Tag,
    Text,
    VStack,
} from '@chakra-ui/react';
import axios from '../util/axios';

const DEFAULT_GAME_ID = '0042500401';

export const meta = () => [{ title: 'Model Comparison | Basketpal' }];

export const loader = ({ request }) => {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId') || DEFAULT_GAME_ID;
    const refresh = searchParams.get('refresh') === 'true';

    const recaps = axios
        .get(`/games/${gameId}/model-comparison`, {
            params: refresh ? { refresh: true } : {},
        })
        .then((response) => response.data);

    return defer({ gameId, recaps });
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

const RecapGrid = ({ recaps }) => {
    const [revealed, setRevealed] = useState({});
    const [allRevealed, setAllRevealed] = useState(false);

    const toggleReveal = (blindLabel) => {
        setRevealed((prev) => ({ ...prev, [blindLabel]: !prev[blindLabel] }));
    };

    const toggleRevealAll = () => {
        setAllRevealed((prev) => !prev);
        setRevealed({});
    };

    return (
        <>
            <Flex justify="flex-end" mb="6">
                <Button onClick={toggleRevealAll}>
                    {allRevealed ? 'Hide All' : 'Reveal All'}
                </Button>
            </Flex>

            <SimpleGrid columns={{ base: 1, lg: 2 }} gap="20px">
                {recaps.map((recap) => (
                    <RecapCard
                        key={recap.blindLabel}
                        recap={recap}
                        revealed={allRevealed || !!revealed[recap.blindLabel]}
                        onToggleReveal={() => toggleReveal(recap.blindLabel)}
                    />
                ))}
            </SimpleGrid>
        </>
    );
};

const RecapGridFallback = () => (
    <Flex direction="column" align="center" gap="4" py="20">
        <Spinner size="xl" color="purple.400" thickness="3px" />
        <Text color="fgMuted">Generating recaps from 8 models…</Text>
    </Flex>
);

const RecapGridError = () => (
    <Text color="red.400" py="10">
        Failed to generate recaps. Try regenerating.
    </Text>
);

export default function ModelComparison() {
    const { gameId, recaps } = useLoaderData();
    const [searchParams] = useSearchParams();

    // Once the loader has consumed `refresh=true` for this load, drop it from
    // the URL so later reloads don't bypass the backend cache.
    useEffect(() => {
        if (searchParams.get('refresh') === 'true') {
            const params = new URLSearchParams(searchParams);
            params.delete('refresh');
            window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
        }
    }, []);

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
                <Button onClick={handleRefresh} colorScheme="purple">
                    Regenerate
                </Button>
            </Flex>

            <Suspense fallback={<RecapGridFallback />}>
                <Await resolve={recaps} errorElement={<RecapGridError />}>
                    {(resolvedRecaps) => <RecapGrid recaps={resolvedRecaps} />}
                </Await>
            </Suspense>
        </Box>
    );
}
