import { redirect } from '@remix-run/node';
import { Outlet } from '@remix-run/react';

export const loader = async ({ request }) => {
    const { pathname } = new URL(request.url);

    if (pathname === '/nba' || pathname === '/nba/') {
        throw redirect('/');
    }

    return null;
};

export default function NbaLayout() {
    return <Outlet />;
}
