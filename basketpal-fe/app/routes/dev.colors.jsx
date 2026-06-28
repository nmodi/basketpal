import { Box, Flex, Text } from '@chakra-ui/react';
import { getTeamStyle, STRATEGY_NAMES, WNBA_TRICODES, WNBA_TEAM_OVERRIDES } from '../util/teamColorStrategy';

const WNBA_NAMES = {
    ATL: 'Dream', CHI: 'Sky', CON: 'Sun', DAL: 'Wings',
    IND: 'Fever', LVA: 'Aces', LA: 'Sparks', MIN: 'Lynx',
    NYL: 'Liberty', PHX: 'Mercury', SEA: 'Storm', WAS: 'Mystics', GSV: 'Valkyries', TOR: 'Tempo', PDX: 'Fire',
};

function StrategyCard({ tricode, strategy }) {
    const style = getTeamStyle(tricode, strategy);
    const current = WNBA_TEAM_OVERRIDES[tricode];
    const isActive = current === strategy || (!current && strategy === 'bold');

    return (
        <Box
            position="relative"
            overflow="hidden"
            borderRadius="md"
            border="1px solid"
            borderColor={isActive ? 'lineStrong' : 'line'}
            bg="surface"
            outline={isActive ? `2px solid ${style.barColor}` : 'none'}
            outlineOffset="2px"
        >
            <Box
                position="absolute"
                inset="0"
                pointerEvents="none"
                style={{ background: style.getGradient('right') }}
            />
            <Box position="absolute" left="0" top="0" bottom="0" w="4px" bg={style.barColor} />
            <Flex direction="column" px="3" py="2.5" pl="4" position="relative" gap="0.5">
                <Text fontSize="10px" color="fgDim" letterSpacing="0.1em" fontFamily="tt-autonomous-mono">
                    {strategy}{isActive ? ' ★' : ''}
                </Text>
                <Text fontSize="sm" fontWeight="bold" color={style.nameColor} fontFamily="monte-stella" letterSpacing="0.05em">
                    {WNBA_NAMES[tricode]}
                </Text>
                <Text fontSize="10px" color="fgDim" fontFamily="tt-autonomous-mono">
                    bar: {style.barColor} · name: {style.nameColor}
                </Text>
            </Flex>
        </Box>
    );
}

export default function ColorPreview() {
    return (
        <Box bg="bg" minH="100vh" px="6" py="8">
            <Text fontSize="lg" fontWeight="bold" color="fg" mb="1" fontFamily="monte-stella" letterSpacing="0.08em">
                WNBA GRADIENT PREVIEW
            </Text>
            <Text fontSize="sm" color="fgMuted" mb="8">
                ★ = current override (or default 'bold'). Update TEAM_OVERRIDES in teamColorStrategy.js.
            </Text>
            <Flex direction="column" gap="10">
                {WNBA_TRICODES.map(tricode => (
                    <Box key={tricode} id={tricode}>
                        <Text fontSize="xs" color="fgDim" letterSpacing="0.14em" mb="3" fontFamily="tt-autonomous-mono">
                            {tricode} — {WNBA_NAMES[tricode]}
                        </Text>
                        <Flex gap="3" wrap="wrap">
                            {STRATEGY_NAMES.map(strategy => (
                                <Box key={strategy} flex="1" minW="200px" maxW="280px">
                                    <StrategyCard tricode={tricode} strategy={strategy} />
                                </Box>
                            ))}
                        </Flex>
                    </Box>
                ))}
            </Flex>
        </Box>
    );
}
