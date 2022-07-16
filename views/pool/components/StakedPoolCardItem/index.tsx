import { AccountInfoSliceNetworkType } from "@elrondnetwork/dapp-core/types";
import ICChevronDown from "assets/svg/chevron-down.svg";
import ICChevronUp from "assets/svg/chevron-up.svg";
import ICMinus from "assets/svg/minus.svg";
import ICPlus from "assets/svg/plus.svg";
import { networkConfigState } from "atoms/dappState";
import { PoolsState } from "atoms/poolsState";
import AddLiquidityModal from "components/AddLiquidityModal";
import Avatar from "components/Avatar";
import RemoveLiquidityModal from "components/RemoveLiquidityModal";
import TextAmt from "components/TextAmt";
import CardTooltip from "components/Tooltip/CardTooltip";
import { toEGLDD } from "helper/balance";
import { formatAmount } from "helper/number";
import { Unarray } from "interface/utilities";
import { useState } from "react";
import { useRecoilValue } from "recoil";

function StakedPoolCardItem({
    poolData,
}: {
    poolData: Unarray<PoolsState["poolToDisplay"]>;
}) {
    const { pool, poolStats, liquidityData } = poolData;
    const [isExpand, setIsExpand] = useState<boolean>(false);
    const [openAddLiquidity, setOpenAddLiquidity] = useState<boolean>(false);
    const [openRemoveLiquidity, setOpenRemoveLiquidity] =
        useState<boolean>(false);
    const network: AccountInfoSliceNetworkType =
        useRecoilValue(networkConfigState).network;

    if (!liquidityData) return null;
    const {
        total_value_locked,
        apr_day: tradingAPR,
        usd_volume: volume24h,
    } = poolStats || {};
    const { capacityPercent, lpValueUsd, ownLiquidity, value0, value1 } =
        liquidityData;
    return (
        <div
            className={`bg-ash-dark-700 clip-corner-4 clip-corner-tr pt-8 pb-5 px-6 sm:px-11 text-white`}
        >
            <div className="flex justify-between pb-9 border-b border-dashed border-ash-gray-500">
                <div className="mr-5">
                    <div className="mt-5 mb-8">
                        <div className="text-2xl font-bold text-white">
                            {pool.tokens[0].symbol}
                        </div>
                        <div className="text-earn font-bold text-lg leading-tight">
                            <TextAmt
                                number={toEGLDD(
                                    pool.tokens[0].decimals,
                                    value0 || 0
                                )}
                            />
                        </div>
                    </div>
                    <div className="mb-8">
                        <div className="text-2xl font-bold text-white">
                            {pool.tokens[1].symbol}
                        </div>
                        <div className="text-earn font-bold text-lg leading-tight">
                            <TextAmt
                                number={toEGLDD(
                                    pool.tokens[1].decimals,
                                    value1 || 0
                                )}
                            />
                        </div>
                    </div>
                    <div className="flex">
                        <button
                            className="clip-corner-1 clip-corner-bl bg-ash-dark-400 hover:bg-ash-dark-300 active:bg-ash-dark-600 transition-all w-14 h-14 flex items-center justify-center text-pink-600 mr-0.5"
                            onClick={() => setOpenAddLiquidity(true)}
                        >
                            <ICPlus />
                        </button>
                        <button
                            className="clip-corner-1 clip-corner-br bg-ash-dark-400 hover:bg-ash-dark-300 active:bg-ash-dark-600 transition-all w-14 h-14 flex items-center justify-center text-yellow-600"
                            onClick={() => setOpenRemoveLiquidity(true)}
                        >
                            <ICMinus />
                        </button>
                    </div>
                </div>
                <div className="flex flex-col justify-end relative">
                    <div className="absolute top-0 right-0 flex flex-row justify-between items-center">
                        <Avatar
                            src={pool.tokens[0].icon}
                            alt={pool.tokens[0].symbol}
                            className="w-[3.25rem] h-[3.25rem]"
                        />
                        <Avatar
                            src={pool.tokens[1].icon}
                            alt={pool.tokens[1].symbol}
                            className="w-[3.25rem] h-[3.25rem] -ml-2.5"
                        />
                    </div>
                    <div className="min-w-[8rem]">
                        <div className="mb-8">
                            <div className="text-stake-gray-500 text-xs underline mb-4 inline-block">
                                <CardTooltip
                                    content={<>Your deposit value in USD</>}
                                >
                                    <span>Estimate in USD</span>
                                </CardTooltip>
                            </div>

                            <div className="text-lg leading-tight">
                                <span className="text-stake-gray-500">$</span>
                                <span className="text-white font-bold">
                                    <TextAmt
                                        number={lpValueUsd || 0}
                                        decimalClassName="text-stake-gray-500"
                                    />
                                </span>
                            </div>
                        </div>
                        <div>
                            <div className="text-stake-gray-500 text-xs underline mb-4 block">
                                <CardTooltip
                                    content={
                                        <>
                                            Percentage of your deposit to the
                                            total liquidity in this pool. It
                                            depends on the reward that
                                            you&apos;ll receive.
                                        </>
                                    }
                                >
                                    <span>Your capacity</span>
                                </CardTooltip>
                            </div>

                            <div className="text-lg text-white font-bold leading-snug">
                                {formatAmount(
                                    capacityPercent?.toNumber() || 0,
                                    {
                                        notation: "standard",
                                    }
                                )}
                                %
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-row mt-6 mb-5.5 justify-between items-center">
                <div className="mr-1">
                    <CardTooltip
                        content={
                            <>
                                Estimation for growth of your deposit over a
                                year, based on trading activity in the past 24
                                hours.
                            </>
                        }
                    >
                        <div className="text-stake-gray-500 text-xs mb-4 underline">
                            Trading APR
                        </div>
                    </CardTooltip>

                    <div className="text-yellow-600 font-bold text-lg">
                        {formatAmount(tradingAPR || 0, {
                            notation: "standard",
                        })}
                        %
                    </div>
                </div>
            </div>

            {isExpand && (
                <>
                    <div className="bg-bg my-4 text-text-input-3">
                        <div className="flex flex-row justify-between items-center h-12 px-4">
                            <div className="underline text-2xs">
                                Total Liquidity
                            </div>
                            <div className="text-sm">
                                $
                                <TextAmt
                                    number={total_value_locked || 0}
                                    options={{ notation: "standard" }}
                                />
                            </div>
                        </div>
                        <div className="flex flex-row justify-between items-center h-12 px-4">
                            <div className="underline text-2xs">24H Volume</div>
                            <div className="text-sm">
                                $
                                <TextAmt
                                    number={volume24h || 0}
                                    options={{ notation: "standard" }}
                                />
                            </div>
                        </div>
                        <div className="flex flex-row justify-between items-center h-12 px-4">
                            <div className="underline text-2xs">LP Token</div>
                            <div className="text-sm">
                                <TextAmt
                                    number={toEGLDD(
                                        pool.lpToken.decimals,
                                        ownLiquidity || 0
                                    )}
                                />{" "}
                                {pool.tokens[0].symbol}-{pool.tokens[1].symbol}
                            </div>
                        </div>
                        <div className="flex flex-row justify-between items-center h-12 px-4">
                            <CardTooltip
                                content={
                                    <>
                                        Estimation for growth of your deposit
                                        over a year, based on trading activity
                                        in the past 24 hours.
                                    </>
                                }
                            >
                                <div className="underline text-2xs">
                                    Trading APR
                                </div>
                            </CardTooltip>

                            <div className="text-sm">
                                {formatAmount(tradingAPR || 0, {
                                    notation: "standard",
                                })}
                                %
                            </div>
                        </div>
                    </div>
                    <div className="text-center mb-8">
                        <a
                            href={`${network.explorerAddress}/tokens/${pool.lpToken.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-earn underline text-2xs font-bold hover:text-earn hover:underline"
                        >
                            View LP Distribution
                        </a>
                    </div>
                </>
            )}

            <div
                className="flex flex-row justify-center items-center select-none cursor-pointer py-2 text-white"
                onClick={() => setIsExpand(!isExpand)}
            >
                <div className="font-bold text-sm mr-2">
                    {isExpand ? "Hide" : "Detail"}
                </div>
                {isExpand ? (
                    <ICChevronUp className="w-2 h-auto" />
                ) : (
                    <ICChevronDown className="w-2 h-auto" />
                )}
            </div>

            <AddLiquidityModal
                open={openAddLiquidity}
                onClose={() => setOpenAddLiquidity(false)}
                poolData={poolData}
            />
            <RemoveLiquidityModal
                open={openRemoveLiquidity}
                onClose={() => setOpenRemoveLiquidity(false)}
                poolData={poolData}
            />
        </div>
    );
}

export default StakedPoolCardItem;
