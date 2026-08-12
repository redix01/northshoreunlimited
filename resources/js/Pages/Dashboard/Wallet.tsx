import { Head, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import PortalLayout from '../../Components/PortalLayout';
import DepositModal from '../../Components/portal/DepositModal';
import DepositPanel from '../../Components/portal/DepositPanel';
import MarketTicker from '../../Components/portal/MarketTicker';
import TransactionHistory from '../../Components/portal/TransactionHistory';
import WalletBalanceCard from '../../Components/portal/WalletBalanceCard';
import WithdrawModal from '../../Components/portal/WithdrawModal';
import type {
    AccountTransaction,
    PageProps,
    Quote,
    Wallet,
    WalletSummary,
} from '../../types';

interface Props extends PageProps {
    wallet: WalletSummary;
    transactions: AccountTransaction[];
    quotes: Quote[];
    wallets: Wallet[];
}

type Filter = 'all' | 'deposit' | 'withdrawal';

const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'deposit', label: 'Deposits' },
    { key: 'withdrawal', label: 'Withdrawals' },
];

export default function WalletPage() {
    const { wallet, transactions, quotes, wallets } = usePage<Props>().props;

    const [depositOpen, setDepositOpen] = useState(false);
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [filter, setFilter] = useState<Filter>('all');

    const visible = useMemo(
        () =>
            filter === 'all'
                ? transactions
                : transactions.filter(transaction => transaction.kind === filter),
        [transactions, filter],
    );

    return (
        <PortalLayout active="Markets" onTalkToAdvisor={() => setDepositOpen(true)}>
            <Head title="Wallet" />

            <div className="space-y-5">
                <MarketTicker quotes={quotes} />

                <div className="grid gap-5 lg:grid-cols-3">
                    <div className="min-w-0 lg:col-span-2">
                        <WalletBalanceCard
                            wallet={wallet}
                            onDeposit={() => setDepositOpen(true)}
                            onWithdraw={() => setWithdrawOpen(true)}
                        />
                    </div>

                    <DepositPanel wallets={wallets} />
                </div>

                <div>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold text-[var(--portal-text)]">
                            Transaction History
                        </h2>

                        <div className="flex items-center gap-1 rounded-lg bg-[var(--portal-surface-2)] p-0.5">
                            {FILTERS.map(item => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setFilter(item.key)}
                                    aria-pressed={filter === item.key}
                                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                                        filter === item.key
                                            ? 'bg-[var(--portal-accent)] text-[var(--portal-accent-on)]'
                                            : 'text-[var(--portal-muted)] hover:text-[var(--portal-text)]'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <TransactionHistory transactions={visible} title="" detailed />
                </div>
            </div>

            <DepositModal
                open={depositOpen}
                onClose={() => setDepositOpen(false)}
                wallets={wallets}
                basePrice={wallet.base_price}
            />

            <WithdrawModal
                open={withdrawOpen}
                onClose={() => setWithdrawOpen(false)}
                wallets={wallets}
                balance={wallet.balance}
                basePrice={wallet.base_price}
                baseSymbol={wallet.base_symbol}
            />
        </PortalLayout>
    );
}
