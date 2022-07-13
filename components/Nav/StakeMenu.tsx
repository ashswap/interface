import ImgLPGem from "assets/images/lp-gem.png";
import ImgMintGem from "assets/images/mint-gem.png";
import ImgVoteGem from "assets/images/vote-gem.png";
import ICChevronDown from "assets/svg/chevron-down.svg";
import ICStakeGov from "assets/svg/stake-gov.svg";
import ICStakeLP from "assets/svg/stake-lp.svg";
import ICStakeMintAoc from "assets/svg/stake-mint-aoc.svg";
import ICStake from "assets/svg/stake.svg";
import { addLPSessionIdAtom } from "atoms/addLiquidity";
import BaseModal from "components/BaseModal";
import BaseTooltip from "components/BaseTooltip";
import OnboardTooltip from "components/Tooltip/OnboardTooltip";
import { useOnboarding } from "hooks/useOnboarding";
import { useScreenSize } from "hooks/useScreenSize";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import styles from "./Nav.module.css";
import ICGovStatsSquare from "assets/svg/gov-stats-square.svg";
import ICGovFarmSquare from "assets/svg/gov-farm-square.svg";
import ICGovBoostSquare from "assets/svg/gov-boost-square.svg";
import ICGovVoteSquare from "assets/svg/gov-vote-square.svg";
import { useTrackTransactionStatus } from "@elrondnetwork/dapp-core/hooks";
const SOCIALS = [
    {
        name: "Liquidity Stake",
        url: "/stake/farms",
    },
    { name: "Governance Stake", url: "/stake/gov" },
];
function HeadlessLink(
    props: React.DetailedHTMLProps<
        React.AnchorHTMLAttributes<HTMLAnchorElement>,
        HTMLAnchorElement
    >
) {
    let { href, children, ...rest } = props;
    return href ? (
        <Link href={href}>
            <a {...rest}>{children}</a>
        </Link>
    ) : (
        <>{children}</>
    );
}
function StakeMenu() {
    const [mIsOpen, setMIsOpen] = useState(false);
    const { isMobile } = useScreenSize();
    const [openTooltip, setOpenTooltip] = useState(false);
    const router = useRouter();
    const addLPSessionId = useRecoilValue(addLPSessionIdAtom);
    const { isSuccessful } = useTrackTransactionStatus({
        transactionId: addLPSessionId,
    });
    const [onboaringFarmFromAddedLp, setOnboardedFarmFromAddedLp] =
        useOnboarding("pool_farm_from_added_lp");

    useEffect(() => {
        setOpenTooltip(false);
    }, [router.route]);
    if (!isMobile)
        return (
            <div>
                <BaseTooltip
                    placement="bottom"
                    open={
                        openTooltip &&
                        (!isSuccessful || !onboaringFarmFromAddedLp)
                    }
                    onOpenChange={(val) => setOpenTooltip(val)}
                    content={
                        <div className="grid grid-cols-3 w-screen max-w-5xl gap-1">
                            <Link href="/stake/farms">
                                <a>
                                    <div
                                        className={`transition-all bg-stake-dark-400 hover:bg-[#454765] ${styles.stakeMenuItem} p-4 md:p-8 h-full`}
                                    >
                                        <div className="relative">
                                            <ICStakeLP className="text-ash-gray-600/30 h-18 absolute top-0 right-0" />
                                            <div className="mb-12">
                                                <div className="w-12 mb-2">
                                                    <Image
                                                        src={ImgLPGem}
                                                        alt="farming icon"
                                                        layout="responsive"
                                                    />
                                                </div>

                                                <div className="text-ash-cyan-500 text-sm font-bold">
                                                    Liquidity Stake
                                                </div>
                                            </div>
                                            <div className="text-white bg-ash-dark-400/30 p-6 text-sm font-bold">
                                                Stake LP-Tokens to farm ASH
                                                everyday
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </Link>
                            <Link href="/stake/gov">
                                <a>
                                    <div
                                        className={`transition-all bg-stake-dark-400 hover:bg-[#454765] ${styles.stakeMenuItem} p-4 md:p-8 h-full`}
                                    >
                                        <div className="relative">
                                            <ICStakeGov className="text-ash-gray-600/30 h-18 absolute top-0 right-0" />
                                            <div className="mb-12">
                                                <div className="w-12 mb-2">
                                                    <Image
                                                        src={ImgVoteGem}
                                                        alt="vote-escrow icon"
                                                        layout="responsive"
                                                    />
                                                </div>

                                                <div className="text-pink-600 text-sm font-bold">
                                                    Governance Stake
                                                </div>
                                            </div>
                                            <div className="bg-ash-dark-400/30 p-6">
                                                <div className="text-white text-sm font-bold mb-4">
                                                    Stake ASH to get veASH, for:
                                                </div>
                                                <div className="flex flex-col space-y-2 text-stake-gray-500 text-xs font-bold">
                                                    <div className="flex">
                                                        <ICGovStatsSquare className="w-3 h-3 text-stake-gray-500 mr-2" />
                                                        <div>
                                                            Earning transaction
                                                            fees
                                                        </div>
                                                    </div>
                                                    <div className="flex">
                                                        <ICGovBoostSquare className="w-3 h-3 text-stake-gray-500 mr-2" />
                                                        <div>Yield boost</div>
                                                    </div>
                                                    <div className="flex">
                                                        <ICGovFarmSquare className="w-3 h-3 text-stake-gray-500 mr-2" />
                                                        <div>
                                                            Vote{" "}
                                                            <span className="text-ash-cyan-500">
                                                                Liquidity Stake
                                                            </span>{" "}
                                                            weight
                                                        </div>
                                                    </div>
                                                    <div className="flex">
                                                        <ICGovVoteSquare className="w-3 h-3 text-stake-gray-500 mr-2" />
                                                        <div>
                                                            Create Proposals
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </Link>
                            <div
                                className={`transition-all bg-stake-dark-400 hover:bg-[#454765] ${styles.stakeMenuItem} p-4 md:p-8`}
                            >
                                <div className="relative">
                                    <ICStakeMintAoc className="text-ash-gray-600/30 h-18 absolute top-0 right-0" />
                                    <div className="mb-12">
                                        <div className="w-12 mb-2">
                                            <Image
                                                src={ImgMintGem}
                                                alt="farming icon"
                                                layout="responsive"
                                            />
                                        </div>

                                        <div className="text-stake-green-500 text-sm font-bold">
                                            Mint Stake
                                        </div>
                                    </div>
                                    <div className="text-stake-gray-500 bg-ash-dark-400/30 p-6 text-sm font-bold">
                                        On developing...
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                >
                    <div>
                        <OnboardTooltip
                            open={onboaringFarmFromAddedLp && isSuccessful}
                            placement="bottom-start"
                            zIndex={20}
                            onArrowClick={() =>
                                setOnboardedFarmFromAddedLp(true)
                            }
                            content={
                                <OnboardTooltip.Panel>
                                    <div className="text-white text-xs font-bold p-3 max-w-[16rem]">
                                        <span>
                                            After you add liquidity you can{" "}
                                        </span>
                                        <span className="text-stake-green-500">
                                            stake{" "}
                                        </span>
                                        <span>your LP tokens in a </span>
                                        <span className="text-ash-cyan-500">
                                            [LP-Stake farm]{" "}
                                        </span>
                                        <span>to earn more rewards!</span>
                                    </div>
                                </OnboardTooltip.Panel>
                            }
                        >
                            <div>
                                <button
                                    className={`${styles.btn} outline-none`}
                                >
                                    <ICStake className="inline-block w-4 h-4 md:mr-2 transition-none" />
                                    <div className="flex items-center">
                                        <span className="truncate">Stake</span>
                                        <ICChevronDown className="inline w-2 ml-1 transition-none" />
                                    </div>
                                </button>
                            </div>
                        </OnboardTooltip>
                    </div>
                </BaseTooltip>
            </div>
        );
    return (
        <div>
            <div
                role="button"
                className={`${styles.btn} sm:hidden outline-none ${
                    mIsOpen && styles.active
                }`}
                onClick={() => setMIsOpen(true)}
            >
                <ICStake className="inline-block w-4 h-4 md:mr-2" />
                <div className="flex items-center">
                    <span className="truncate">Stake</span>
                    <ICChevronDown className="inline w-2 ml-1 transition-none" />
                </div>
            </div>
            <BaseModal
                isOpen={mIsOpen}
                onRequestClose={() => setMIsOpen(false)}
                type="drawer_btt"
                className="clip-corner-4 clip-corner-tl bg-ash-dark-600 p-4 text-white max-h-screen flex flex-col"
            >
                <div className="flex justify-end mb-3.5">
                    <BaseModal.CloseBtn />
                </div>
                <div className="grow overflow-auto">
                    <div className="px-6 pb-[3.75rem]">
                        <div className="mb-9 text-2xl font-bold">Stake</div>
                        <div className="grid grid-cols-1 gap-4">
                            {SOCIALS.map(({ name, url }) => {
                                return (
                                    <HeadlessLink
                                        key={name}
                                        href={url}
                                        onClick={() => setMIsOpen(false)}
                                    >
                                        <div className="bg-ash-dark-400 px-6 h-12 flex items-center text-xs font-bold text-white">
                                            <span className="capitalize truncate">
                                                {name}
                                            </span>
                                        </div>
                                    </HeadlessLink>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </BaseModal>
        </div>
    );
}

export default StakeMenu;
