import { Link } from '@inertiajs/react';
import { Wrench } from 'lucide-react';

interface Props {
    message: string;
    support: string;
}

export default function Maintenance({ message, support }: Props) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-dash-bg)] px-4 text-[var(--color-dash-text)]">
            <div className="w-full max-w-md rounded-lg border border-[var(--color-dash-border)] bg-[var(--color-dash-surface)] p-8 text-center">
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 text-gold">
                    <Wrench size={22} />
                </div>
                <h1 className="text-lg font-semibold">Portal unavailable</h1>
                <p className="mt-2 text-sm text-[var(--color-dash-muted)]">{message}</p>
                <p className="mt-6 text-xs text-[var(--color-dash-muted)]">
                    Need help? Contact <a href={`mailto:${support}`} className="text-gold hover:text-gold/80">{support}</a>
                </p>
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="mt-6 w-full rounded-lg border border-[var(--color-dash-border)] px-4 py-2 text-sm font-medium text-[var(--color-dash-muted)] hover:text-[var(--color-dash-text)]"
                >
                    Sign out
                </Link>
            </div>
        </div>
    );
}
