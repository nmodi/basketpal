// Convert an axios failure into a Remix Response so route ErrorBoundaries can
// render based on the upstream status (404 vs 5xx). Pass the result to `throw`.
export function toRouteError(error) {
    const status = error?.response?.status ?? 500;
    const detail = error?.response?.data?.detail ?? error?.message ?? 'Request failed';
    return new Response(typeof detail === 'string' ? detail : 'Request failed', { status });
}
