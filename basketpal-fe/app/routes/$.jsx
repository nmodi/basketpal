import { redirect } from '@remix-run/node';

export const loader = async () => {
    throw redirect('/');
};

export default function NotFoundRedirect() {
    return null;
}
