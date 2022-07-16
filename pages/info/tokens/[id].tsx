import { AccountInfoSliceNetworkType } from "@elrondnetwork/dapp-core/types";
import { Tooltip } from "antd";
import ICArrowRight from "assets/svg/arrow-right.svg";
import ICCopy from "assets/svg/copy.svg";
import ICNewTabRound from "assets/svg/new-tab-round.svg";
import ICSwap from "assets/svg/swap.svg";
import { networkConfigState } from "atoms/dappState";
import Avatar from "components/Avatar";
import InfoLayout from "components/Layout/Info";
import { ASHSWAP_CONFIG } from "const/ashswapConfig";
import { IN_POOL_TOKENS } from "const/pool";
import { fetcher } from "helper/common";
import { formatAmount } from "helper/number";
import { PoolStatsRecord } from "interface/poolStats";
import { IToken } from "interface/token";
import { TxStatsRecord } from "interface/txStats";
import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { ReactElement } from "react";
import { useRecoilValue } from "recoil";
import useSWR from "swr";
import PoolsTable from "views/info/components/PoolsTable";
import TxsTable from "views/info/components/TxsTable";
import TokenChart from "views/info/Tokens/[id]/TokenChart";

type TokenStats = {
    change_percentage_day: number;
    change_percentage_hour: number;
    change_percentage_week: number;
    liquidity: number;
    price: number;
    token_id: string;
    transaction_count: number;
    volume: number;
};
type Page<P = {}> = NextPage<P> & {
    getLayout?: (page: ReactElement) => ReactElement;
};
type props = { token: IToken };
const TokenDetailPage: Page<props> = ({ token }: props) => {
    const { data: stats } = useSWR<TokenStats>(
        token.id
            ? `${ASHSWAP_CONFIG.ashApiBaseUrl}/token/${token.id}/statistic`
            : null,
        fetcher,
        { refreshInterval: 5 * 60 * 1000 }
    );
    const { data: pools } = useSWR<PoolStatsRecord[]>(
        token.id
            ? `${ASHSWAP_CONFIG.ashApiBaseUrl}/token/${token.id}/pool`
            : null,
        fetcher,
        { refreshInterval: 5 * 60 * 1000 }
    );
    const { data: txs } = useSWR<TxStatsRecord[]>(
        token.id
            ? `${ASHSWAP_CONFIG.ashApiBaseUrl}/token/${token.id}/transaction?offset=0&limit=50`
            : null,
        fetcher,
        { refreshInterval: 5 * 60 * 1000 }
    );
    const network: AccountInfoSliceNetworkType =
        useRecoilValue(networkConfigState).network;
    return (
        <div>
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
                        <Link href="/info/tokens">
                            <a>
                                <span className="text-white">Tokens</span>
                            </a>
                        </Link>
                    </li>
                    <li>
                        <ICArrowRight className="inline mr-1 text-ash-gray-500" />
                        <span className="text-ash-gray-500">
                            {token?.symbol}
                        </span>
                    </li>
                </ul>
                <div className="flex flex-col space-y-5 lg:space-y-0 lg:flex-row items-start lg:items-center mb-[2.375rem]">
                    <div className="flex items-center">
                        <h1 className="text-2xl lg:text-4xl font-bold text-white mr-4">
                            {token.symbol}
                        </h1>
                        <Avatar
                            src={token.icon}
                            alt={token.symbol}
                            className="w-6 h-6 lg:w-8 lg:h-8 mr-5"
                        />
                    </div>
                    <div className="flex items-center flex-row-reverse lg:flex-row">
                        <div className="bg-ash-dark-600 h-10 flex items-center px-4 mr-2">
                            <div className="mr-3 text-xs md:text-sm">
                                {token.symbol} Coin
                            </div>
                            <div className="text-ash-gray-500 text-2xs md:text-xs">
                                {token.id}
                            </div>
                            <div className="mx-4">|</div>
                            <Tooltip trigger={["click"]} title="copied">
                                <button
                                    onClick={() => {
                                        if (typeof window !== "undefined") {
                                            window.navigator.clipboard.writeText(
                                                token.id
                                            );
                                        }
                                    }}
                                >
                                    <ICCopy className="w-4 h-4 lg:w-5 lg:h-5" />
                                </button>
                            </Tooltip>
                        </div>
                        <div className="bg-ash-dark-600 h-8 lg:h-10 px-2.5 lg:px-4 flex items-center text-2xs md:text-xs lg:text-sm mr-2">
                            <span className="text-ash-gray-500">$</span>
                            <span className="text-white">
                                {formatAmount(stats?.price || 0, {
                                    notation: "standard",
                                    isInteger: true,
                                })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex space-x-2 mb-4 md:mb-18">
                    {/* TODO: set swap pair by query params */}
                    <Link href="/swap">
                        <a>
                            <span className="bg-pink-600 w-8 md:w-auto h-8 md:h-10 flex items-center justify-center md:px-4 text-sm text-white">
                                <ICSwap className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="hidden md:inline-block ml-2">
                                    Swap
                                </span>
                            </span>
                        </a>
                    </Link>
                    {/* <button className="bg-ash-dark-500 h-10 flex items-center px-4 text-sm">
                        <ICStarOutline className="w-5 h-5 mr-2" />
                        <span>Save</span>
                    </button> */}
                    <a
                        href={network.explorerAddress + "/tokens/" + token.id}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <span className="bg-ash-dark-500 h-8 md:h-10 flex items-center px-4 text-xs md:text-sm text-white">
                            <ICNewTabRound className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" />
                            <span>
                                <span className="hidden md:inline">
                                    View on{" "}
                                </span>
                                <span>Elrond Explorer</span>
                            </span>
                        </span>
                    </a>
                </div>
                <div className="flex flex-wrap xl:flex-nowrap overflow-hidden">
                    <div className="w-full xl:w-[16.625rem] flex flex-col space-y-2 mb-12 md:mb-18">
                        <div className="h-18 md:h-[7.5rem] px-4 md:px-[1.625rem] py-4 md:pt-5 md:pb-8 bg-ash-dark-600 flex flex-col justify-between">
                            <div className="text-2xs md:text-xs">
                                Total Liquidity
                            </div>
                            <div className="flex justify-between items-baseline">
                                <div className="text-sm md:text-lg">
                                    <span className="text-ash-gray-500">$</span>
                                    <span>
                                        {formatAmount(stats?.liquidity || 0, {
                                            notation: "standard",
                                        })}
                                    </span>
                                </div>
                                {/* <div className="text-ash-purple-500 text-xs font-bold">
                                    <ICArrowBottomRight className="inline w-2 h-2 mr-1" />
                                    <span>-19%</span>
                                </div>
                                <div className="text-ash-green-500 text-xs font-bold">
                                    <ICArrowTopRight className="inline w-2 h-2 mr-1" />
                                    <span>%</span>
                                </div> */}
                            </div>
                        </div>
                        <div className="h-18 md:h-[7.5rem] px-4 md:px-[1.625rem] py-4 md:pt-5 md:pb-8 bg-ash-dark-600 flex flex-col justify-between">
                            <div className="text-2xs md:text-xs">
                                Volume (24h)
                            </div>
                            <div className="flex justify-between items-baseline">
                                <div className="text-sm md:text-lg">
                                    <span className="text-ash-gray-500">$</span>
                                    <span>
                                        {formatAmount(stats?.volume || 0, {
                                            notation: "standard",
                                        })}
                                    </span>
                                </div>
                                {/* <div className="text-ash-purple-500 text-xs font-bold">
                                    <ICArrowBottomRight className="inline w-2 h-2 mr-1" />
                                    <span>-19%</span>
                                </div> */}
                            </div>
                        </div>
                        <div className="h-18 md:h-[7.5rem] px-4 md:px-[1.625rem] py-4 md:pt-5 md:pb-8 bg-ash-dark-600 flex flex-col justify-between">
                            <div className="text-2xs md:text-xs">
                                Transactions (24h)
                            </div>
                            <div className="flex justify-between items-baseline">
                                <div className="text-sm md:text-lg">
                                    <span>
                                        {formatAmount(
                                            stats?.transaction_count || 0,
                                            { isInteger: true }
                                        )}
                                    </span>
                                </div>
                                {/* <div className="text-ash-green-500 text-xs font-bold">
                                    <ICArrowTopRight className="inline w-2 h-2 mr-1" />
                                    <span>19%</span>
                                </div> */}
                            </div>
                        </div>
                    </div>
                    <div className="grow h-[23.5rem] xl:ml-4 overflow-hidden mb-12 md:mb-18">
                        <TokenChart token={token} />
                    </div>
                </div>
                <div className="mb-12 md:mb-16">
                    <h2 className="text-lg font-bold text-white mb-5 md:mb-7">
                        Top Pools - Pairs
                    </h2>
                    <PoolsTable data={pools || []} />
                </div>
                <div className="mb-12 md:mb-16">
                    <h2 className="text-lg font-bold text-white mb-5 md:mb-7">
                        Transactions
                    </h2>
                    <TxsTable data={txs || []} />
                </div>
            </div>
        </div>
    );
};
TokenDetailPage.getLayout = function getLayout(page: ReactElement) {
    return <InfoLayout>{page}</InfoLayout>;
};
export const getServerSideProps: GetServerSideProps = async ({ params }) => {
    const { id: tokenId } = params || {};
    const token = IN_POOL_TOKENS.find((t) => t.id === tokenId);
    if (token) {
        return {
            props: { token },
        };
    }
    return {
        props: {},
        redirect: { permanent: true, destination: "/info/tokens" },
    };
};
export default TokenDetailPage;
