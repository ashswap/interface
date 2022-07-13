import { useGetNetworkConfig } from "@elrondnetwork/dapp-core/hooks";
import { AccountInfoSliceNetworkType } from "@elrondnetwork/dapp-core/types";
import ICArrowRight from "assets/svg/arrow-right.svg";
import ICCopy from "assets/svg/copy.svg";
import ICNewTabRound from "assets/svg/new-tab-round.svg";
import ICPlus from "assets/svg/plus.svg";
import ICSwap from "assets/svg/swap.svg";
import Avatar from "components/Avatar";
import CopyBtn from "components/CopyBtn";
import InfoLayout from "components/Layout/Info";
import { ASHSWAP_CONFIG } from "const/ashswapConfig";
import pools from "const/pool";
import { fetcher } from "helper/common";
import { formatAmount } from "helper/number";
import IPool from "interface/pool";
import { TxStatsRecord } from "interface/txStats";
import { GetServerSideProps } from "next";
import Link from "next/link";
import { ReactElement, useMemo } from "react";
import useSWR from "swr";
import TxsTable from "views/info/components/TxsTable";
import PoolChart from "views/info/Pools/[address]/PoolChart";
type PoolStats = {
    apr_day: number;
    apr_month: number;
    apr_week: number;
    emission_apr: number;
    first_admin_fee_usd: number;
    first_total_fee_usd: number;
    pool_address: string;
    ratio: number;
    second_admin_fee_usd: number;
    second_total_fee_usd: number;
    timestamp: number;
    token_1_amount: number;
    token_1_value_locked: number;
    token_2_amount: number;
    token_2_value_locked: number;
    total_value_locked: number;
    transaction_count: number;
    unique_traders: number;
    usd_volume: number;
    volume: number;
};
type Props = { pool: IPool };
function PoolDetailPage({ pool }: Props) {
    const { data: stats } = useSWR<PoolStats>(
        pool.address
            ? `${ASHSWAP_CONFIG.ashApiBaseUrl}/pool/${pool.address}/statistic`
            : null,
        fetcher,
        { refreshInterval: 5 * 60 * 1000 }
    );
    const { data: txs } = useSWR<TxStatsRecord[]>(
        pool.address
            ? `${ASHSWAP_CONFIG.ashApiBaseUrl}/pool/${pool.address}/transaction?offset=0&limit=50`
            : null,
        fetcher,
        { refreshInterval: 5 * 60 * 1000 }
    );
    const [token1, token2] = useMemo(() => pool.tokens, [pool]);
    const network: AccountInfoSliceNetworkType = useGetNetworkConfig().network;
    return (
        <div className="text-white py-7 max-w-6xl mx-auto px-6 sm:px-0">
            <ul className="flex space-x-1 text-xs mb-6">
                <li>
                    <Link href="/info">
                        <a>
                            <span className="text-white">Dashboard</span>
                        </a>
                    </Link>
                </li>
                <li>
                    <ICArrowRight className="inline mr-1 text-ash-gray-500" />
                    <Link href="/info/pools">
                        <a>
                            <span className="text-white">Pools</span>
                        </a>
                    </Link>
                </li>
                <li>
                    <ICArrowRight className="inline mr-1 text-ash-gray-500" />
                    <span className="text-ash-gray-500">
                        {token1.symbol} & {token2.symbol}
                    </span>
                </li>
            </ul>
            <div className="flex items-center mb-4 lg:mb-5">
                <div className="text-2xl lg:text-4xl font-bold mr-4 lg:mr-7">
                    {token1.symbol} & {token2.symbol}
                </div>
                <div className="flex">
                    <Avatar
                        src={token1.icon}
                        alt={token1.symbol}
                        className="w-6 h-6 lg:w-8 lg:h-8"
                    />
                    <Avatar
                        src={token2.icon}
                        alt={token2.symbol}
                        className="w-6 h-6 lg:w-8 lg:h-8 -ml-1.5"
                    />
                </div>
            </div>
            <div className="flex flex-wrap mb-9 lg:mb-20">
                <div className="flex items-center bg-ash-dark-600 h-8 lg:h-10 px-2.5 lg:px-4 mr-2 mb-2">
                    <div className="text-xs lg:text-sm">Pair Add</div>
                    <div className="text-2xs lg:text-xs text-stake-gray-500 px-2.5 border-r border-r-stake-gray-500">
                        {pool.address.slice(0, 4)}...{pool.address.slice(-4)}
                    </div>
                    <div className="pl-2.5 flex lg:pl-5">
                        <CopyBtn text={pool.address}>
                            <ICCopy className="w-4 h-4 lg:w-5 lg:h-5" />
                        </CopyBtn>
                    </div>
                </div>
                <div className="flex items-center bg-ash-dark-600 h-8 lg:h-10 px-2.5 lg:px-4 mr-2 mb-2">
                    <div className="text-xs lg:text-sm">{token1.symbol}</div>
                    <div className="text-2xs lg:text-xs text-stake-gray-500 px-2.5 border-r border-r-stake-gray-500">
                        {token1.id}
                    </div>
                    <div className="pl-2.5 flex lg:pl-5">
                        <CopyBtn text={token1.id}>
                            <ICCopy className="w-4 h-4 lg:w-5 lg:h-5" />
                        </CopyBtn>
                    </div>
                </div>
                <div className="flex items-center bg-ash-dark-600 h-8 lg:h-10 px-2.5 lg:px-4 mr-2 mb-2">
                    <div className="text-xs lg:text-sm">{token2.symbol}</div>
                    <div className="text-2xs lg:text-xs text-stake-gray-500 px-2.5 border-r border-r-stake-gray-500">
                        {token2.id}
                    </div>
                    <div className="pl-2.5 flex lg:pl-5">
                        <CopyBtn text={token2.id}>
                            <ICCopy className="w-4 h-4 lg:w-5 lg:h-5" />
                        </CopyBtn>
                    </div>
                </div>
            </div>
            <div className="flex space-x-2 text-xs md:text-sm mb-4 lg:mb-18">
                <Link href={`/swap`}>
                    <a>
                        <div className="flex items-center justify-center bg-pink-600 w-8 h-8 md:w-auto md:h-10 text-white md:px-4">
                            <ICSwap className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="hidden md:block ml-2">Swap</span>
                        </div>
                    </a>
                </Link>
                <Link href={`/pool`}>
                    <a>
                        <div className="flex items-center justify-center bg-pink-600/20 w-8 h-8 md:w-auto md:h-10 text-pink-600 md:px-4">
                            <ICPlus className="w-3 h-3" />
                            <span className="hidden md:block ml-2">
                                Deposit
                            </span>
                        </div>
                    </a>
                </Link>
                <a
                    href={`${network.explorerAddress}/accounts/${pool.address}`}
                    target="_blank"
                    rel="noreferrer"
                >
                    <div className="flex items-center justify-center bg-ash-gray-600/10 h-8 md:h-10 text-white px-2.5 md:px-4">
                        <ICNewTabRound className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="ml-2">
                            <span className="hidden sm:inline">View on </span>
                            Elrond Explorer
                        </span>
                    </div>
                </a>
            </div>

            <div className="flex flex-wrap xl:flex-nowrap overflow-hidden mb-10 md:mb-18">
                <div className="w-full xl:w-[16.625rem] flex flex-col space-y-2 mb-6 xl:mb-0">
                    <div className="px-4 md:px-[1.625rem] py-4 md:pt-5 md:pb-8 bg-ash-dark-600 flex flex-col justify-between">
                        <div className="mb-5 sm:mb-8 text-2xs sm:text-xs">
                            Pooled Tokens
                        </div>
                        <div className="flex items-center justify-between text-sm sm:text-lg mb-2.5 sm:mb-6">
                            <div>
                                <span>
                                    {formatAmount(stats?.token_1_amount)}{" "}
                                </span>
                                <span className="text-stake-gray-500">
                                    {token1.symbol}
                                </span>
                            </div>
                            <Avatar
                                src={token1.icon}
                                alt={token1.symbol}
                                className="w-4.5 h-4.5 sm:w-6 sm:h-6"
                            />
                        </div>
                        <div className="flex items-center justify-between text-sm sm:text-lg">
                            <div>
                                <span>
                                    {formatAmount(stats?.token_2_amount)}{" "}
                                </span>
                                <span className="text-stake-gray-500">
                                    {token2.symbol}
                                </span>
                            </div>
                            <Avatar
                                src={token2.icon}
                                alt={token2.symbol}
                                className="w-4.5 h-4.5 sm:w-6 sm:h-6"
                            />
                        </div>
                    </div>
                    <div className="px-4 md:px-[1.625rem] py-4 md:pt-5 md:pb-8 bg-ash-dark-600 flex flex-col justify-between">
                        <div className="mb-2 text-2xs sm:text-xs">
                            Total Liquidity
                        </div>
                        <div className="text-sm sm:text-lg">
                            <span className="text-stake-gray-500">$ </span>
                            <span>
                                {formatAmount(stats?.total_value_locked)}
                            </span>
                        </div>
                    </div>
                    <div className="px-4 md:px-[1.625rem] py-4 md:pt-5 md:pb-8 bg-ash-dark-600 flex flex-col justify-between">
                        <div className="mb-2 text-2xs sm:text-xs">
                            Volume (24h)
                        </div>
                        <div className="text-sm sm:text-lg">
                            <span className="text-stake-gray-500">$ </span>
                            <span>{formatAmount(stats?.usd_volume)}</span>
                        </div>
                    </div>
                    <div className="px-4 md:px-[1.625rem] py-4 md:pt-5 md:pb-8 bg-ash-dark-600 flex flex-col justify-between">
                        <div className="mb-2 text-2xs sm:text-xs">
                            Fees (24H)
                        </div>
                        <div className="text-sm sm:text-lg">
                            <span className="text-stake-gray-500">$ </span>
                            <span>
                                {stats
                                    ? formatAmount(
                                          stats.first_total_fee_usd +
                                              stats.second_total_fee_usd -
                                              stats.first_admin_fee_usd -
                                              stats.second_admin_fee_usd
                                      )
                                    : "0.00"}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="grow xl:ml-4 overflow-hidden xl:h-[32.25rem] h-[20rem]">
                    <PoolChart pool={pool} />
                </div>
            </div>
            <div>
                <h2 className="text-white text-lg font-bold mb-5">
                    Transactions
                </h2>
                <TxsTable data={txs || []} />
            </div>
        </div>
    );
}

PoolDetailPage.getLayout = function getLayout(page: ReactElement) {
    return <InfoLayout>{page}</InfoLayout>;
};
export const getServerSideProps: GetServerSideProps = async ({ params }) => {
    const { address } = params || {};
    const pool = pools.find((t) => t.address === address);
    if (pool) {
        return {
            props: { pool },
        };
    }
    return { redirect: { permanent: true, destination: "/info/pools" } };
};
export default PoolDetailPage;
