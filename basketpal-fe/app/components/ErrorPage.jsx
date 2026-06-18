import { Flex, Text, Box } from '@chakra-ui/react';
import { Link } from '@remix-run/react';

const COPY = {
    notFound: {
        title: 'NOT FOUND',
        message: "We couldn't find that game or page.",
    },
    client: {
        title: 'SOMETHING WENT WRONG',
        message: "That request couldn't be completed.",
    },
    server: {
        title: 'SERVICE UNAVAILABLE',
        message: 'The stats service is having trouble right now. Please try again in a moment.',
    },
};

function copyForStatus(status) {
    if (status === 404) return COPY.notFound;
    if (status >= 500) return COPY.server;
    return COPY.client;
}

const labelStyle = {
    fontFamily: 'tt-autonomous-mono',
    fontWeight: 'bold',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
};

const ErrorPage = ({ status = 500 }) => {
    const { title, message } = copyForStatus(status);

    return (
        <Flex
            direction="column"
            align="center"
            justify="center"
            textAlign="center"
            minH="100vh"
            bg="bg"
            px="6"
        >
            <Text
                fontFamily="monte-stella, sans-serif"
                fontWeight="bold"
                fontSize={{ base: '96px', md: '140px' }}
                lineHeight="1"
                color="lineStrong"
            >
                {status}
            </Text>

            <Text {...labelStyle} fontSize="lg" color="fg" mt="4">
                {title}
            </Text>

            <Text fontSize="sm" color="fgDim" mt="3" maxW="380px">
                {message}
            </Text>

            <Flex gap="3" mt="8">
                <Box
                    as="button"
                    onClick={() => {
                        if (typeof window !== 'undefined') window.location.reload();
                    }}
                    {...labelStyle}
                    fontSize="xs"
                    color="bg"
                    bg="fg"
                    px="5"
                    py="3"
                    borderRadius="6px"
                    _hover={{ opacity: 0.85 }}
                    transition="opacity 0.15s"
                >
                    Try again
                </Box>

                <Link to="/" style={{ textDecoration: 'none' }}>
                    <Box
                        {...labelStyle}
                        fontSize="xs"
                        color="fgMuted"
                        px="5"
                        py="3"
                        borderRadius="6px"
                        border="1px solid"
                        borderColor="line"
                        _hover={{ color: 'fg', borderColor: 'lineStrong' }}
                        transition="color 0.15s, border-color 0.15s"
                    >
                        ← Schedule
                    </Box>
                </Link>
            </Flex>
        </Flex>
    );
};

export default ErrorPage;
