import { PoolsState } from "context/pools";
import { Unarray } from "interface/utilities";
import React, { useState } from "react";
import Image from "next/image";
import AddLiquidityModal from "components/AddLiquidityModal";
import Down from "assets/svg/down-white.svg";
import {
    AccountInfoSliceNetworkType,
    useGetNetworkConfig,
} from "@elrondnetwork/dapp-core";
import CardTooltip from "components/Tooltip/CardTooltip";
import TextAmt from "components/TextAmt";
import { formatAmount } from "helper/number";
import OnboardTooltip from "components/Tooltip/OnboardTooltip";
import { useOnboarding } from "hooks/useOnboarding";
import { useScreenSize } from "hooks/useScreenSize";

function PoolCardItem({
    poolData,
    withTooltip,
}: {
    poolData: Unarray<PoolsState["poolToDisplay"]>;
    withTooltip?: boolean;
}) {
    const { pool } = poolData;
    const [isExpand, setIsExpand] = useState<boolean>(false);
    const [openAddLiquidity, setOpenAddLiquidity] = useState<boolean>(false);
    const network: AccountInfoSliceNetworkType = useGetNetworkConfig().network;
    const {
        total_value_locked,
        apr_day: tradingAPR,
        usd_volume: volume24h,
    } = poolData.poolStats || {};
    const screenSize = useScreenSize();
    const [onboardingPoolDeposit, setOnboardedPoolDeposit] =
        useOnboarding("pool_deposit");
    return (
        <div
            className={`bg-ash-dark-700 clip-corner-4 clip-corner-tr pt-8 pb-5 px-6 sm:px-11 text-white`}
        >
            <div className="flex flex-row justify-between items-start mb-12">
                <div>
                    <div className="text-text-input-3 text-xs pb-2.5">
                        Deposit
                    </div>
                    <div className="flex flex-row items-baseline text-2xl font-bold">
                        <span>{pool.tokens[0].name}</span>
                        <span className="text-sm px-3">&</span>
                        <span>{pool.tokens[1].name}</span>
                    </div>
                </div>
                <div className="flex flex-row justify-between items-center">
                    <div className="w-[3.25rem]">
                        <Image src={pool.tokens[0].icon} alt="token icon" />
                    </div>
                    <div className="w-[3.25rem] -ml-2.5">
                        <Image src={pool.tokens[1].icon} alt="token icon" />
                    </div>
                </div>
            </div>
            <div className="flex flex-row my-12 justify-between items-center">
                <div>
                    <CardTooltip
                        content={
                            <>
                                Estimation for growth of your deposit over a
                                year, based on trading activity in the past 24
                                hours.
                            </>
                        }
                    >
                        <div className="text-text-input-3 text-xs mb-4 underline">
                            Trading APR
                        </div>
                    </CardTooltip>

                    <div className="text-yellow-600 font-bold text-lg leading-tight">
                        {formatAmount(tradingAPR || 0, {
                            notation: "standard",
                        })}
                        %
                    </div>
                </div>
            </div>
            <OnboardTooltip
                open={onboardingPoolDeposit && screenSize.md}
                zIndex={10}
                placement="left"
                disabled={!withTooltip}
                onArrowClick={() => setOnboardedPoolDeposit(true)}
                content={
                    <OnboardTooltip.Panel>
                        <div className="p-3 max-w-[8rem] text-xs font-bold">
                            <span className="text-stake-green-500">
                                Deposit{" "}
                            </span>
                            <span>a pool to start your Farm & Earn</span>
                        </div>
                    </OnboardTooltip.Panel>
                }
            >
                <button
                    className="w-full clip-corner-1 clip-corner-br bg-pink-600 h-14 text-sm font-bold text-white underline"
                    onClick={() => {
                        setOpenAddLiquidity(true);
                        setOnboardedPoolDeposit(true);
                    }}
                >
                    Deposit
                </button>
            </OnboardTooltip>

            <div className="bg-bg my-4 text-text-input-3">
                <div className="flex flex-row justify-between items-center h-12 px-4">
                    <CardTooltip
                        content={
                            <>
                                Total value of overall deposited tokens in this
                                pool.
                            </>
                        }
                    >
                        <div className="underline text-2xs">
                            Total Liquidity
                        </div>
                    </CardTooltip>
                    <div className="text-sm">
                        $
                        <TextAmt
                            number={total_value_locked || 0}
                            options={{ notation: "standard" }}
                        />
                    </div>
                </div>
                <div className="flex flex-row justify-between items-center h-12 px-4">
                    <CardTooltip
                        content={
                            <>
                                Total value of token traded in the past 24
                                hours.
                            </>
                        }
                    >
                        <div className="underline text-2xs">24H Volume</div>
                    </CardTooltip>
                    <div className="text-sm">
                        $
                        <TextAmt
                            number={volume24h || 0}
                            options={{ notation: "standard" }}
                        />
                    </div>
                </div>
                {isExpand && (
                    <>
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
                    </>
                )}
            </div>

            {isExpand && (
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
            )}

            <div
                className="flex flex-row justify-center items-center select-none cursor-pointer py-2"
                onClick={() => setIsExpand(!isExpand)}
            >
                <div className="font-bold text-sm mr-2">
                    {isExpand ? "Hide" : "Detail"}
                </div>
                <Down
                    style={{
                        transform: `rotate(${isExpand ? "180" : "0"}deg)`,
                    }}
                />
            </div>

            <AddLiquidityModal
                open={openAddLiquidity}
                onClose={() => setOpenAddLiquidity(false)}
                poolData={poolData}
            />
        </div>
    );
}

export default PoolCardItem;
