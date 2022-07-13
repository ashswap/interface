import { useTrackTransactionStatus } from "@elrondnetwork/dapp-core/hooks";
import ICCapacity from "assets/svg/capacity.svg";
import ICChevronDown from "assets/svg/chevron-down.svg";
import ICChevronUp from "assets/svg/chevron-up.svg";
import ICLock from "assets/svg/lock.svg";
import ICUnlock from "assets/svg/unlock.svg";
import ICWallet from "assets/svg/wallet.svg";
import { accIsLoggedInState } from "atoms/dappState";
import {
    govLockedAmtState,
    govRewardLPAmtState,
    govRewardLPTokenState,
    govRewardLPValueState,
    govTotalLockedAmtState,
    govTotalLockedPctState,
    govTotalSupplyVeASH,
    govUnlockTSState,
    govVeASHAmtState,
} from "atoms/govState";
import { walletTokenPriceState } from "atoms/walletState";
import Avatar from "components/Avatar";
import BaseModal from "components/BaseModal";
import GlowingButton from "components/GlowingButton";
import GOVStakeModal from "components/GOVStakeModal";
import TextAmt from "components/TextAmt";
import CardTooltip from "components/Tooltip/CardTooltip";
import { ASHSWAP_CONFIG } from "const/ashswapConfig";
import { ASH_TOKEN, VE_ASH_DECIMALS } from "const/tokens";
import { toEGLDD } from "helper/balance";
import { fetcher } from "helper/common";
import { formatAmount } from "helper/number";
import { useConnectWallet } from "hooks/useConnectWallet";
import useGovClaimReward from "hooks/useGovContract/useGovClaimReward";
import useGovUnlockASH from "hooks/useGovContract/useGovUnlockASH";
import useMounted from "hooks/useMounted";
import { useScreenSize } from "hooks/useScreenSize";
import moment from "moment";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRecoilValue } from "recoil";
import useSWR from "swr";
import GovMenu from "./components/GovMenu";
const ExpiredLockTooltip = ({
    children,
    disabled,
}: {
    children: JSX.Element;
    disabled?: boolean;
}) => {
    if (disabled) return <>{children}</>;
    return (
        <CardTooltip
            content={
                <>
                    The lock period has expired, please withdraw your fund
                    first.
                </>
            }
        >
            {children}
        </CardTooltip>
    );
};
function GovStats() {
    const lockedAmt = useRecoilValue(govLockedAmtState);
    const veASH = useRecoilValue(govVeASHAmtState);
    const unlockTS = useRecoilValue(govUnlockTSState);
    const totalSupplyVeASH = useRecoilValue(govTotalSupplyVeASH);
    const totalLockedAmt = useRecoilValue(govTotalLockedAmtState);
    const rewardLPAmt = useRecoilValue(govRewardLPAmtState);
    const rewardLPToken = useRecoilValue(govRewardLPTokenState);
    const rewardValue = useRecoilValue(govRewardLPValueState);
    const totalLockedPct = useRecoilValue(govTotalLockedPctState);

    const { data: adminFee24h } = useSWR<number>(
        `${ASHSWAP_CONFIG.ashApiBaseUrl}/stake/governance/admin-fee`,
        fetcher
    );
    const [isQAExpand, setIsQAExpand] = useState(false);
    const [openStakeGov, setOpenStakeGov] = useState(false);
    const [openHarvestResult, setOpenHarvestResult] = useState(false);
    const [harvestId, setHarvestId] = useState("");
    useTrackTransactionStatus({
        transactionId: harvestId,
        onSuccess: () => setOpenHarvestResult(true),
    });

    const claimReward = useGovClaimReward();
    const unlockASH = useGovUnlockASH();
    const loggedIn = useRecoilValue(accIsLoggedInState);
    const mounted = useMounted();
    const connectWallet = useConnectWallet();
    const tokenPrices = useRecoilValue(walletTokenPriceState);
    const screenSize = useScreenSize();
    const capacityPct = useMemo(() => {
        if (totalSupplyVeASH.eq(0)) return "_";
        return veASH.multipliedBy(100).div(totalSupplyVeASH).toFixed(2);
    }, [veASH, totalSupplyVeASH]);
    const apr = useMemo(() => {
        if (!adminFee24h) return 0;
        return (
            (adminFee24h * 365 * 100) /
            toEGLDD(ASH_TOKEN.decimals, totalLockedAmt)
                .multipliedBy(tokenPrices[ASH_TOKEN.id])
                .toNumber()
        );
    }, [adminFee24h, totalLockedAmt, tokenPrices]);
    const canClaim = useMemo(() => {
        return rewardLPAmt && rewardLPAmt.gt(0);
    }, [rewardLPAmt]);
    const canUnlockASH = useMemo(() => {
        return (
            lockedAmt.gt(0) &&
            unlockTS &&
            unlockTS.minus(moment().unix()).lte(0)
        );
    }, [unlockTS, lockedAmt]);
    return (
        <>
            <div className="mb-7">
                <h1 className="text-pink-600 text-2xl md:text-5xl font-bold mb-7 md:mb-11">
                    Governance Stake
                </h1>
                <GovMenu />
            </div>
            <div className="flex flex-col md:flex-row">
                <div className="md:w-[21.875rem] shrink-0 flex flex-col px-7 lg:px-9 pb-9 pt-7 lg:pt-14 bg-stake-dark-400 mb-4 md:mb-0 md:mr-4 lg:mr-[1.875rem]">
                    <h2 className="text-lg md:text-2xl mb-11 md:mb-11 font-bold text-white">
                        Your staked
                    </h2>
                    <div className="flex flex-col space-y-6">
                        <div className="bg-ash-dark-400/30 px-[1.25rem] pt-7 pb-5">
                            <div className="px-5 mb-7">
                                <CardTooltip
                                    content={
                                        <>
                                            <div>
                                                By staking ASH to holding veASH,
                                                you’ll earn bounties from
                                                trading fees in ASHSWAP DEX. The
                                                reward will return to the user
                                                as LP-Tokens.
                                            </div>
                                        </>
                                    }
                                >
                                    <div className="inline-block text-stake-gray-500 text-sm font-bold underline uppercase mb-7">
                                        your reward
                                    </div>
                                </CardTooltip>
                                <div className="flex items-center">
                                    {rewardLPToken && (
                                        <div className="flex items-center">
                                            <Avatar
                                                src={
                                                    rewardLPToken.tokens[0].icon
                                                }
                                                alt={
                                                    rewardLPToken.tokens[0]
                                                        .symbol
                                                }
                                                className="w-[1.125rem] h-[1.125rem]"
                                            />
                                            <Avatar
                                                src={
                                                    rewardLPToken.tokens[1].icon
                                                }
                                                alt={
                                                    rewardLPToken.tokens[1]
                                                        .symbol
                                                }
                                                className="w-[1.125rem] h-[1.125rem] -ml-1 mr-2"
                                            />
                                        </div>
                                    )}
                                    <div className="text-lg">
                                        <span className="text-ash-gray-500">
                                            $
                                        </span>
                                        <span className="text-white font-bold">
                                            <TextAmt
                                                number={rewardValue}
                                                decimalClassName="text-stake-gray-500"
                                            />
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <GlowingButton
                                theme="cyan"
                                className={`text-sm font-bold w-full h-[3.375rem]`}
                                disabled={!canClaim}
                                onClick={() =>
                                    canClaim &&
                                    claimReward().then(
                                        ({ sessionId }) =>
                                            sessionId && setHarvestId(sessionId)
                                    )
                                }
                            >
                                Harvest
                            </GlowingButton>
                        </div>
                        <div className="bg-ash-dark-400/30 px-[1.25rem] pt-7 pb-5">
                            <div className="px-5 mb-7">
                                <CardTooltip
                                    content={
                                        <div>
                                            Total ASH that you’ve staked. You
                                            cannot claim back until the lock
                                            period ends.
                                        </div>
                                    }
                                >
                                    <div className="inline-block text-stake-gray-500 text-sm font-bold underline uppercase mb-7">
                                        your staked ash
                                    </div>
                                </CardTooltip>
                                <div className="flex items-center">
                                    {/* <div className="w-[1.125rem] h-[1.125rem] mr-2">
                                        <Image src={ImgUsdt} alt="token icon" />
                                    </div> */}
                                    <Avatar
                                        src={ASH_TOKEN.icon}
                                        alt={ASH_TOKEN.symbol}
                                        className="w-[1.125rem] h-[1.125rem] mr-2"
                                    />
                                    <div className="text-lg text-white font-bold">
                                        <TextAmt
                                            number={toEGLDD(
                                                ASH_TOKEN.decimals,
                                                lockedAmt
                                            )}
                                            decimalClassName="text-stake-gray-500"
                                        />
                                    </div>
                                </div>
                            </div>
                            {canUnlockASH ? (
                                <GlowingButton
                                    theme="yellow"
                                    className="text-sm font-bold w-full h-[3.375rem]"
                                    onClick={() => unlockASH()}
                                >
                                    <ICUnlock className="w-6 h-6 mr-2" />
                                    <span>Withdraw</span>
                                </GlowingButton>
                            ) : (
                                <button
                                    className="bg-ash-dark-400 text-stake-gray-500 text-sm font-bold w-full h-[3.375rem] flex items-center justify-center cursor-not-allowed"
                                    disabled={true}
                                >
                                    <ICLock className="w-6 h-6 mr-2" />
                                    <span>
                                        {lockedAmt.gt(0)
                                            ? moment
                                                  .unix(unlockTS.toNumber())
                                                  .format("DD MMM, yyyy")
                                            : "Lock period"}
                                    </span>
                                </button>
                            )}
                        </div>
                        <div className="bg-ash-dark-400/30 px-[1.25rem] pt-7 pb-5">
                            <div className="px-5 mb-7">
                                <CardTooltip
                                    content={
                                        <div>
                                            Voting-Escrow ASH. A type of token
                                            that you’ll receive after staking
                                            your ASH, veASH will reduce
                                            day-by-day till the lock period
                                            ends. You can extend your lock
                                            period to recover your veASH.
                                        </div>
                                    }
                                >
                                    <div className="inline-block text-stake-gray-500 text-sm font-bold underline mb-7">
                                        YOUR veASH
                                    </div>
                                </CardTooltip>

                                <div className="flex items-center">
                                    {/* <div className="w-[1.125rem] h-[1.125rem] mr-2">
                                        <Image src={ImgUsdt} alt="token icon" />
                                    </div> */}
                                    <div className="w-[1.125rem] h-[1.125rem] mr-2 rounded-full bg-ash-purple-500"></div>
                                    <div className="text-lg text-white font-bold">
                                        <TextAmt
                                            number={toEGLDD(
                                                VE_ASH_DECIMALS,
                                                veASH
                                            )}
                                            decimalClassName="text-stake-gray-500"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <div className="bg-ash-dark-400 text-stake-gray-500 px-3 py-2 w-7/12 h-[3.375rem] overflow-hidden">
                                    <div className="flex items-center mb-2">
                                        <ICLock className="w-3 h-3 mr-1" />
                                        <CardTooltip
                                            content={
                                                <div>
                                                    Your lock period. When this
                                                    period ends, you can claim
                                                    back your staked ASH.
                                                </div>
                                            }
                                        >
                                            <span className="text-2xs font-bold underline">
                                                Lock
                                            </span>
                                        </CardTooltip>
                                    </div>
                                    <div className="text-xs font-bold">
                                        {lockedAmt.gt(0)
                                            ? moment
                                                  .unix(unlockTS.toNumber())
                                                  .format("DD MMM, yyyy")
                                            : "_"}
                                    </div>
                                </div>
                                <div className="bg-ash-dark-400 text-stake-gray-500 px-3 py-2 w-5/12 h-[3.375rem] overflow-hidden">
                                    <div className="flex items-center mb-2">
                                        <ICCapacity className="w-3 h-3 mr-1" />
                                        <CardTooltip
                                            content={
                                                <div>
                                                    Percentage of your veASH to
                                                    the total veASH in ASHSWAP
                                                    Governance Stake. It depends
                                                    on the reward that you’ll
                                                    receive.
                                                </div>
                                            }
                                        >
                                            <span className="text-2xs font-bold underline">
                                                Capacity
                                            </span>
                                        </CardTooltip>
                                    </div>
                                    <div className="text-xs font-bold">
                                        {capacityPct}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {mounted &&
                        (loggedIn ? (
                            <ExpiredLockTooltip disabled={!canUnlockASH}>
                                <span>
                                    <GlowingButton
                                        theme="pink"
                                        className={`text-sm md:text-lg font-bold w-full h-14 md:h-[4.5rem] mt-3`}
                                        disabled={canUnlockASH}
                                        onClick={() =>
                                            !canUnlockASH &&
                                            setOpenStakeGov(true)
                                        }
                                    >
                                        Add / Manage Stake
                                    </GlowingButton>
                                </span>
                            </ExpiredLockTooltip>
                        ) : (
                            <button
                                className="bg-pink-600 text-white text-sm md:text-lg font-bold w-full h-14 md:h-[4.5rem] flex items-center justify-center mt-3"
                                onClick={() => connectWallet()}
                            >
                                <ICWallet className="mr-2" />
                                <span>Connect wallet</span>
                            </button>
                        ))}
                </div>
                <div className="grow px-7 lg:px-16 pt-7 lg:pt-14 pb-9 bg-stake-dark-400">
                    <h2 className="text-lg md:text-2xl mb-10 md:mb-11 font-bold text-white">
                        Overall stats
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 lg:gap-x-7.5 gap-y-1 sm:gap-y-4 lg:gap-y-6 mb-16">
                        <div className="bg-ash-dark-400/30 px-[2.375rem] py-7 flex flex-col justify-between">
                            <div className="text-stake-gray-500 text-sm font-bold mb-6 sm:mb-2 leading-tight">
                                APR
                            </div>
                            <div className="text-pink-600 text-lg font-bold leading-tight">
                                {formatAmount(apr, { notation: "standard" })}%
                            </div>
                        </div>
                        <div className="bg-ash-dark-400/30 px-[2.375rem] py-7 flex flex-col justify-between">
                            <div className="text-stake-gray-500 text-sm font-bold mb-6 sm:mb-2 uppercase leading-tight">
                                PERCENTAGE of total ASH Locked
                            </div>
                            <div className="text-white text-lg font-bold leading-tight">
                                {formatAmount(totalLockedPct)}%
                            </div>
                        </div>
                        <div className="bg-ash-dark-400/30 px-[2.375rem] py-7 flex flex-col justify-between">
                            <div className="text-stake-gray-500 text-sm font-bold mb-6">
                                TOTAL STAKED ASH
                            </div>
                            <div className="flex items-center">
                                {/* <div className="w-[1.125rem] h-[1.125rem] mr-2">
                                    <Image src={ImgUsdt} alt="token icon" />
                                </div> */}
                                <Avatar
                                    src={ASH_TOKEN.icon}
                                    alt={ASH_TOKEN.symbol}
                                    className="w-[1.125rem] h-[1.125rem] mr-2"
                                />
                                <div className="text-white text-lg font-bold">
                                    <TextAmt
                                        number={toEGLDD(
                                            ASH_TOKEN.decimals,
                                            totalLockedAmt
                                        )}
                                        options={{ notation: "standard" }}
                                        decimalClassName="text-stake-gray-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="bg-ash-dark-400/30 px-[2.375rem] py-7 flex flex-col justify-between">
                            <div className="text-stake-gray-500 text-sm font-bold mb-6">
                                TOTAL veASH
                            </div>
                            <div className="flex items-center">
                                {/* <div className="w-[1.125rem] h-[1.125rem] mr-2">
                                    <Image src={ImgUsdt} alt="token icon" />
                                </div> */}
                                <div className="w-[1.125rem] h-[1.125rem] mr-2 rounded-full bg-ash-purple-500"></div>
                                <div className="text-white text-lg font-bold">
                                    <TextAmt
                                        number={toEGLDD(
                                            VE_ASH_DECIMALS,
                                            totalSupplyVeASH
                                        )}
                                        options={{ notation: "standard" }}
                                        decimalClassName="text-stake-gray-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mb-16">
                        <div className="text-stake-gray-500 text-sm font-bold mb-4">
                            TIPS
                        </div>
                        <div className="text-xs lg:text-sm mb-9">
                            Stake ASH to receive veASH. You can both earn from
                            transaction fee & have a power for voting!
                        </div>
                        <ul>
                            <li className="text-sm font-bold">
                                <span className="text-stake-green-500">1</span>{" "}
                                ASH locked for{" "}
                                <span className="text-stake-green-500">
                                    4 years
                                </span>{" "}
                                ={" "}
                                <span className="text-stake-green-500">1</span>{" "}
                                veASH
                            </li>
                            <li className="text-sm font-bold">
                                <span className="text-stake-green-500">1</span>{" "}
                                ASH locked for{" "}
                                <span className="text-stake-green-500">
                                    3 years
                                </span>{" "}
                                ={" "}
                                <span className="text-stake-green-500">
                                    0.75
                                </span>{" "}
                                veASH
                            </li>
                            <li className="text-sm font-bold">
                                <span className="text-stake-green-500">1</span>{" "}
                                ASH locked for{" "}
                                <span className="text-stake-green-500">
                                    2 years
                                </span>{" "}
                                ={" "}
                                <span className="text-stake-green-500">
                                    0.5
                                </span>{" "}
                                veASH
                            </li>
                            <li className="text-sm font-bold">
                                <span className="text-stake-green-500">1</span>{" "}
                                ASH locked for{" "}
                                <span className="text-stake-green-500">
                                    1 year
                                </span>{" "}
                                ={" "}
                                <span className="text-stake-green-500">
                                    0.25
                                </span>{" "}
                                veASH
                            </li>
                        </ul>
                    </div>
                    <div>
                        <div className="text-whtie text-sm font-bold mb-5">
                            IMPORTANT NOTE
                        </div>
                        <div className="text-xs lg:text-sm mb-6">
                            Your veASH weight gradually decreases as your
                            escrowed tokens approach their lock expiry.
                        </div>
                        <div className="bg-ash-dark-400/30">
                            <button
                                className="w-full h-14 lg:h-[4.25rem] px-4 lg:px-[2.375rem] flex items-center justify-between text-pink-600"
                                onClick={() => setIsQAExpand((val) => !val)}
                            >
                                <div className="line-clamp-2 text-xs lg:text-sm font-bold grow text-left mr-4">
                                    OMG? Does it mean user will lose money
                                    everyday?
                                </div>
                                {isQAExpand ? (
                                    <ICChevronUp className="w-3 h-auto" />
                                ) : (
                                    <ICChevronDown className="w-3 h-auto" />
                                )}
                            </button>
                            {isQAExpand && (
                                <div className="-mt-1 pb-8 px-4 lg:px-[2.375rem] text-2xs">
                                    <div className="mb-4">
                                        Of course not, when your veASH decreases
                                        to 0. It also means that the lock period
                                        of your ASH is done. You can withdraw
                                        your staked ASH right away.
                                    </div>
                                    <div>
                                        However, If you want to keep your veASH
                                        stays on the maximum, just{" "}
                                        <span className="text-pink-600 underline font-bold">
                                            extend
                                        </span>{" "}
                                        your lock period.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <GOVStakeModal
                open={openStakeGov}
                onClose={() => setOpenStakeGov(false)}
            />
            <BaseModal
                isOpen={openHarvestResult}
                onRequestClose={() => setOpenHarvestResult(false)}
                type={`${screenSize.isMobile ? "drawer_btt" : "modal"}`}
                className="clip-corner-4 clip-corner-tl bg-stake-dark-400 mx-auto max-w-[33.75rem] flex flex-col max-h-full"
            >
                <div className="px-4 pt-4 flex justify-end mb-4">
                    <BaseModal.CloseBtn />
                </div>
                <div className="grow overflow-auto pt-10">
                    <div className="px-[3.375rem] flex flex-col items-center pb-28 border-b border-dashed border-b-ash-gray-500">
                        <div className="text-2xl font-bold text-stake-green-500 mb-12">
                            Harvest successfully
                        </div>
                        {rewardLPToken && (
                            <>
                                <div className="flex items-center mb-9">
                                    <Avatar
                                        src={rewardLPToken.tokens[0].icon}
                                        alt={rewardLPToken.tokens[0].symbol}
                                        className="w-8 h-8"
                                    />
                                    <Avatar
                                        src={rewardLPToken.tokens[1].icon}
                                        alt={rewardLPToken.tokens[1].symbol}
                                        className="w-8 h-8 -ml-1 mr-2"
                                    />
                                </div>
                                <div className="text-center text-ash-gray-500 text-lg font-bold">
                                    <TextAmt number={rewardValue} />
                                    &nbsp; LP-
                                    {rewardLPToken.tokens[0].symbol}
                                    {rewardLPToken.tokens[1].symbol} has been
                                    sent to your wallet
                                </div>
                            </>
                        )}
                    </div>
                    <div className="px-[3.375rem] pb-8">
                        <div className="text-center text-sm text-ash-gray-500 py-7">
                            Suggest actions
                        </div>
                        <Link href="/stake/farms" passHref>
                            <a>
                                <button className="w-full text-center h-12 text-sm font-bold bg-ash-dark-400 text-ash-cyan-500 mb-4">
                                    Stake for farming
                                </button>
                            </a>
                        </Link>
                        <Link href="/pool" passHref>
                            <a>
                                <button className="w-full text-center h-12 text-sm font-bold bg-ash-dark-400 text-pink-600">
                                    Withdraw immediately
                                </button>
                            </a>
                        </Link>
                    </div>
                </div>
            </BaseModal>
        </>
    );
}

export default GovStats;
