import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import { getTeamStyle } from '../../util/teamColorStrategy';

function TimeoutDashes({ count, color }) {
    if (!count) return null;
    return (
        <Flex gap="1.5">
            {Array.from({ length: count }).map((_, i) => (
                <Box key={i} w="14px" h="2.5px" borderRadius="full" bg={color} opacity={0.65} />
            ))}
        </Flex>
    );
}

export default function TeamScore({ team, align, isHome, isLive, scoreColor }) {
    const isRight = align === 'right';
    const teamStyle = getTeamStyle(team.teamTricode);
    const isInBonus = !!team.inBonus && isLive;

    return (
        <Flex
            direction="column"
            justify="flex-start"
            align={isRight ? 'flex-end' : 'flex-start'}
            textAlign={isRight ? 'right' : 'left'}
            flex="1"
            minW="0"
            px={{ base: '5', md: '7' }}
            py={{ base: '5', md: '6' }}
            style={{ background: teamStyle.getGradient(isRight ? 'bottom left' : 'bottom right') }}
            boxShadow="inset 0 1px 0 rgba(255,255,255,0.03)"
        >
            <Text
                fontSize="md"
                fontWeight="bold"
                color="fgMuted"
                letterSpacing="0.08em"
                textTransform="uppercase"
            >
                {team.teamCity}
            </Text>
            <Text
                mt="1"
                fontFamily="monte-stella"
                fontSize={{ base: '3xl', md: '4xl' }}
                fontWeight="black"
                lineHeight="0.95"
                letterSpacing="0.07em"
                textTransform="uppercase"
                color={teamStyle.nameColor}
                noOfLines={2}
            >
                {team.teamName}
            </Text>

            {/* Score + info row */}
            <Flex
                mt="6"
                align="center"
                direction={isRight ? 'row-reverse' : 'row'}
                gap="4"
            >
                {/* Jumbotron score box */}
                <Box
                    bg="bgSunken"
                    border="1px solid"
                    borderColor="lineStrong"
                    px="4"
                    pt="2"
                    pb="3"
                    borderRadius="sm"
                    flexShrink={0}
                >
                    <Text
                        fontFamily="tt-autonomous-mono"
                        fontSize={{ base: '4.5rem', md: '5.5rem' }}
                        lineHeight="0.82"
                        color={scoreColor}
                    >
                        {team.score ?? '—'}
                    </Text>
                </Box>

                {/* Timeouts + label */}
                <Flex
                    direction="column"
                    gap="2"
                    align={isRight ? 'flex-end' : 'flex-start'}
                >
                    {isLive && (
                        <TimeoutDashes count={team.timeoutsRemaining} color={teamStyle.barColor} />
                    )}
                    <Text
                        fontSize="sm"
                        color="fgDim"
                        letterSpacing="0.14em"
                        textTransform="uppercase"
                    >
                        {isHome ? 'Home' : 'Away'}
                    </Text>
                    {isInBonus && (
                        <Badge colorScheme="yellow" variant="outline" size="sm">
                            Bonus
                        </Badge>
                    )}
                </Flex>
            </Flex>
        </Flex>
    );
}
