import { useTrackTransactionStatus } from "@elrondnetwork/dapp-core/hooks";
import {
    Address,
    BigUIntValue,
    ContractFunction,
    TokenIdentifierValue,
    Transaction,
} from "@elrondnetwork/erdjs";
import Fire from "assets/images/fire.png";
import ICArrowDownRounded from "assets/svg/arrow-down-rounded.svg";
import ICChevronDown from "assets/svg/chevron-down.svg";
import ICChevronUp from "assets/svg/chevron-up.svg";
import ICClock from "assets/svg/clock.svg";
import IconClose from "assets/svg/close.svg";
import IconRight from "assets/svg/right-white.svg";
import ICSetting from "assets/svg/setting.svg";
import IconWallet from "assets/svg/wallet.svg";
import {
    accIsInsufficientEGLDState,
    accIsLoggedInState,
} from "atoms/dappState";
import BigNumber from "bignumber.js";
import Avatar from "components/Avatar";
import BaseButton from "components/BaseButton";
import BaseModal from "components/BaseModal";
import GlowingButton from "components/GlowingButton";
import HistoryModal from "components/HistoryModal";
import IconButton from "components/IconButton";
import Setting from "components/Setting";
import TextAmt from "components/TextAmt";
import CardTooltip from "components/Tooltip/CardTooltip";
import OnboardTooltip from "components/Tooltip/OnboardTooltip";
import { useSwap } from "context/swap";
import { toEGLD, toEGLDD, toWei } from "helper/balance";
import { cancellablePromise } from "helper/cancellablePromise";
import PoolContract, { queryPoolContract } from "helper/contracts/pool";
import { formatAmount } from "helper/number";
import {
    sendTransactions,
    useCreateTransaction,
} from "helper/transactionMethods";
import { useConnectWallet } from "hooks/useConnectWallet";
import useMounted from "hooks/useMounted";
import { useOnboarding } from "hooks/useOnboarding";
import { useScreenSize } from "hooks/useScreenSize";
import { DappSendTransactionsPropsType } from "interface/dappCore";
import IPool from "interface/pool";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRecoilValue } from "recoil";
import { useDebounce } from "use-debounce";
import SwapAmount from "./components/SwapAmount";
import styles from "./Swap.module.css";
const MaiarPoolTooltip = ({
    children,
    pool,
}: {
    children: JSX.Element;
    pool?: IPool;
}) => {
    const [openMaiarPoolTooltip, setOpenMaiarPoolTooltip] = useState(false);
    const screenSize = useScreenSize();
    useEffect(() => {
        setOpenMaiarPoolTooltip(!!pool?.isMaiarPool && screenSize.md);
    }, [pool, screenSize.md]);
    if (!pool?.isMaiarPool) {
        return <>{children}</>;
    }
    return (
        <OnboardTooltip
            open={openMaiarPoolTooltip}
            onArrowClick={() => {
                setOpenMaiarPoolTooltip(false);
            }}
            strategy={screenSize.isMobile ? "absolute" : "fixed"}
            placement="left"
            zIndex={10}
            arrowStyle={() => ({})}
            content={({ size }) => {
                return (
                    <>
                        {pool && (
                            <div
                                style={{
                                    filter: screenSize.isMobile
                                        ? ""
                                        : "drop-shadow(0px 4px 50px rgba(0, 0, 0, 0.5))",
                                    maxWidth: size?.width,
                                }}
                            >
                                <div className="clip-corner-4 clip-corner-bl bg-ash-dark-600 p-[1px] max-w-full sm:max-w-[23rem] backdrop-blur-[30px]">
                                    <div className="clip-corner-4 clip-corner-bl bg-ash-dark-400 px-12 py-6">
                                        <div className="font-bold text-sm leading-tight">
                                            <Avatar
                                                src={pool.tokens[0].icon}
                                                alt={pool.tokens[0].symbol}
                                                className="w-4 h-4"
                                            />
                                            &nbsp;
                                            {pool.tokens[0].symbol}
                                            <span> - </span>
                                            <Avatar
                                                src={pool.tokens[1].icon}
                                                alt={pool.tokens[1].symbol}
                                                className="w-4 h-4"
                                            />
                                            &nbsp;
                                            {pool.tokens[1].symbol}
                                            <span>
                                                {" "}
                                                only available in Battle of
                                                Yields
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                );
            }}
        >
            {children}
        </OnboardTooltip>
    );
};
const Swap = () => {
    const screenSize = useScreenSize();
    const mounted = useMounted();
    const {
        tokenFrom,
        tokenTo,
        valueFrom,
        valueTo,
        setValueFrom,
        setValueTo,
        setTokenFrom,
        setTokenTo,
        pool,
        rates,
        setRates,
        isInsufficentFund,
        slippage,
    } = useSwap();
    const [valueFromDebound] = useDebounce(valueFrom, 500);
    const [showSetting, setShowSetting] = useState<boolean>(false);
    const [isOpenHistoryModal, openHistoryModal] = useState<boolean>(false);
    const [fee, setFee] = useState<number>(0);
    const [isOpenFairPrice, setIsOpenFairPrice] = useState(false);
    const [swapping, setSwapping] = useState(false);
    const [swapId, setSwapId] = useState("");
    const [onboardingHistory, setOnboardedHistory] =
        useOnboarding("swap_history");
    const { isPending, isSuccessful } = useTrackTransactionStatus({
        transactionId: swapId,
    });
    const [fetchingAmtOut, setFetchingAmtOut] = useState(false);

    const connectWallet = useConnectWallet();
    const loggedIn = useRecoilValue(accIsLoggedInState);
    const isInsufficientEGLD = useRecoilValue(accIsInsufficientEGLDState);
    const createTx = useCreateTransaction();

    const [onboardingFairPrice, setOnboaredFairPrice] =
        useOnboarding("swap_fair_price");

    useEffect(() => {
        setShowSetting(false);
        openHistoryModal(false);
    }, [screenSize.isMobile]);
    const revertToken = () => {
        setTokenFrom(tokenTo);
        setTokenTo(tokenFrom);
    };

    const rawValueFrom = useMemo(() => {
        if (!valueFromDebound || !tokenFrom) {
            return new BigNumber(0);
        }

        return toWei(tokenFrom, valueFromDebound);
    }, [valueFromDebound, tokenFrom]);

    const rawValueTo = useMemo(() => {
        if (!valueTo || !tokenTo) {
            return new BigNumber(0);
        }

        return toWei(tokenTo, valueTo);
    }, [valueTo, tokenTo]);

    // calculate amount out
    useEffect(() => {
        if (!pool || !tokenFrom || !tokenTo || rawValueFrom.eq(0)) {
            return;
        }

        const calcPromise = queryPoolContract.calculateAmountOut(
            pool,
            tokenFrom.id,
            tokenTo.id,
            rawValueFrom
        );
        const { promise, cancel } = cancellablePromise(calcPromise);
        setFetchingAmtOut(true);
        promise
            .then((amtOut) => {
                setValueTo(
                    amtOut
                        .div(
                            new BigNumber(10).exponentiatedBy(tokenTo.decimals)
                        )
                        .toString(10)
                );
            })
            .catch(() => {})
            .finally(() => setFetchingAmtOut(false));
        return () => cancel();
    }, [tokenFrom, tokenTo, pool, rawValueFrom, setValueTo]);

    // find pools + fetch reserves
    useEffect(() => {
        if (!pool) {
            return;
        }
        const [token1, token2] = pool.tokens;
        if (pool.isMaiarPool) {
            Promise.all([
                queryPoolContract.getReserveMaiarPool(pool),
                queryPoolContract.getFeePct(pool),
            ]).then(([reserves, fee]) => {
                const rate1 = toEGLDD(token2.decimals, reserves.token2).div(
                    toEGLDD(token1.decimals, reserves.token1)
                );
                const rate2 = new BigNumber(1).div(rate1);
                setRates([
                    toWei(token2, rate1.toString()),
                    toWei(token1, rate2.toString()),
                ]);
                setFee(fee.isNaN() ? 0 : fee.toNumber());
            });
            return;
        }

        const poolContract = new PoolContract(pool.address);
        Promise.all([
            poolContract.getAmountOut(
                token1.id,
                token2.id,
                new BigNumber(10).exponentiatedBy(token1.decimals)
            ),
            poolContract.getAmountOut(
                token2.id,
                token1.id,
                new BigNumber(10).exponentiatedBy(token2.decimals)
            ),
            queryPoolContract.getFeePct(pool),
        ]).then(([rate1, rate2, fee]) => {
            setRates([rate1, rate2]);
            setFee(fee.isNaN() ? 0 : fee.toNumber());
        });
    }, [pool, setRates]);

    const swap = useCallback(async () => {
        if (
            !loggedIn ||
            !tokenFrom ||
            !tokenTo ||
            swapping ||
            !pool ||
            fetchingAmtOut
        ) {
            return;
        }

        if (rawValueFrom.eq(0) || rawValueFrom.isNaN()) return;
        const minAmtOut = new BigNumber(
            Math.floor(rawValueTo.multipliedBy(1 - slippage).toNumber())
        );
        if (minAmtOut.eq(0) || minAmtOut.isNaN()) return;
        setSwapping(true);

        try {
            let tx: Transaction;
            if (pool.isMaiarPool) {
                tx = await createTx(new Address(pool.address), {
                    func: new ContractFunction("ESDTTransfer"),
                    gasLimit: 8_000_000,
                    args: [
                        new TokenIdentifierValue(tokenFrom.id),
                        new BigUIntValue(rawValueFrom),
                        new TokenIdentifierValue("swapTokensFixedInput"),
                        new TokenIdentifierValue(tokenTo.id),
                        new BigUIntValue(minAmtOut),
                    ],
                });
            } else {
                tx = await createTx(new Address(pool?.address), {
                    func: new ContractFunction("ESDTTransfer"),
                    gasLimit: 8_000_000,
                    args: [
                        new TokenIdentifierValue(tokenFrom.id),
                        new BigUIntValue(rawValueFrom),
                        new TokenIdentifierValue("exchange"),
                        new TokenIdentifierValue(tokenTo.id),
                        new BigUIntValue(minAmtOut),
                    ],
                });
            }

            const payload: DappSendTransactionsPropsType = {
                transactions: tx,
                transactionsDisplayInfo: {
                    successMessage: `Swap succeed ${formatAmount(
                        toEGLDD(tokenFrom.decimals, rawValueFrom).toNumber(),
                        { notation: "standard" }
                    )} ${tokenFrom.symbol} to ${formatAmount(
                        toEGLDD(tokenTo.decimals, rawValueTo).toNumber(),
                        { notation: "standard" }
                    )} ${tokenTo.symbol}`,
                },
            };
            const { error, sessionId } = await sendTransactions(payload);
            if (onboardingHistory && sessionId) {
                setSwapId(sessionId);
            }
        } catch (error) {
            console.log(error);
            // TODO: extension close without response
            // notification.warn({
            //     message: error as string,
            //     duration: 10
            // });
        }
        setValueTo("");
        setValueFrom("");
        setSwapping(false);
    }, [
        loggedIn,
        pool,
        rawValueFrom,
        tokenFrom,
        tokenTo,
        swapping,
        createTx,
        setValueTo,
        setValueFrom,
        slippage,
        rawValueTo,
        onboardingHistory,
        fetchingAmtOut,
    ]);

    const priceImpact = useMemo(() => {
        if (!pool || !rates || !tokenFrom || !rawValueFrom || !rawValueTo) {
            return 0;
        }

        if (rawValueFrom.isZero()) {
            return 0;
        }

        const rate =
            tokenFrom?.id === pool.tokens[0].id
                ? rates[0].toString()
                : rates[1].toString();

        const realOut = rawValueFrom
            .div(new BigNumber(10).exponentiatedBy(tokenFrom.decimals))
            .multipliedBy(rate);

        return realOut
            .minus(rawValueTo)
            .abs()
            .multipliedBy(100)
            .div(realOut)
            .toNumber();
    }, [pool, rates, tokenFrom, rawValueFrom, rawValueTo]);

    const minimumReceive = useMemo(() => {
        if (!tokenTo || !rawValueTo) {
            return new BigNumber(0);
        }
        return toEGLD(
            tokenTo,
            rawValueTo.multipliedBy(1 - slippage).toString()
        );
    }, [tokenTo, rawValueTo, slippage]);

    useEffect(() => {
        if (!tokenFrom) {
            setValueFrom("");
        }
    }, [tokenFrom, setValueFrom]);
    useEffect(() => {
        if (!tokenTo) {
            setValueTo("");
        }
    }, [tokenTo, setValueTo]);

    return (
        <div className="flex flex-col items-center pt-3.5 pb-12 px-6">
            <div className="flex max-w-full">
                <div
                    className={`w-full max-w-[30.75rem] transition-none relative ${
                        showSetting && !screenSize.isMobile && "sm:w-7/12"
                    }`}
                >
                    <div className="clip-corner-4 clip-corner-tl bg-ash-dark-600 absolute top-0 left-0 right-0 bottom-0 z-[-1]"></div>
                    <div className="text-base">
                        <div className="px-6 py-8 sm:px-12 text-white">
                            <div className={styles.fire}>
                                <Image
                                    src={Fire}
                                    width={151}
                                    height={230}
                                    alt="Ash"
                                />
                            </div>
                            <div className="flex flex-row justify-between pl-4 mb-12">
                                <div className="font-bold text-2xl">Swap</div>
                                <div className="flex flex-row gap-2">
                                    <OnboardTooltip
                                        open={
                                            screenSize.lg &&
                                            onboardingHistory &&
                                            !!swapId &&
                                            !!isSuccessful
                                        }
                                        zIndex={10}
                                        placement="top"
                                        onArrowClick={() =>
                                            setOnboardedHistory(true)
                                        }
                                        content={
                                            <OnboardTooltip.Panel>
                                                <div className="px-6 py-2.5 text-sm font-bold text-white">
                                                    <span>View your </span>
                                                    <span className="text-stake-green-500">
                                                        history{" "}
                                                    </span>
                                                    <span>of transactions</span>
                                                </div>
                                            </OnboardTooltip.Panel>
                                        }
                                    >
                                        <div>
                                            <BaseButton
                                                className="w-10 h-10 bg-ash-dark-400 hover:bg-ash-dark-300 active:bg-ash-dark-600 text-white"
                                                onClick={() => {
                                                    if (loggedIn) {
                                                        openHistoryModal(
                                                            (state) => !state
                                                        );
                                                    }
                                                    setOnboardedHistory(true);
                                                }}
                                            >
                                                <ICClock />
                                            </BaseButton>
                                        </div>
                                    </OnboardTooltip>
                                    <BaseButton
                                        className="w-10 h-10 bg-ash-dark-400 hover:bg-ash-dark-300 active:bg-ash-dark-600 text-white"
                                        onClick={() =>
                                            setShowSetting((state) => !state)
                                        }
                                    >
                                        <ICSetting
                                            className={`${
                                                showSetting
                                                    ? "text-pink-600"
                                                    : "text-white"
                                            }`}
                                        />
                                    </BaseButton>
                                </div>
                            </div>
                            <MaiarPoolTooltip pool={pool}>
                                <div className="relative">
                                    <SwapAmount
                                        topLeftCorner
                                        showQuickSelect={
                                            !tokenFrom && !!tokenTo
                                        }
                                        type="from"
                                        resetPivotToken={() =>
                                            setTokenTo(undefined)
                                        }
                                    />
                                    <div
                                        style={{
                                            height: 4,
                                            position: "relative",
                                        }}
                                    >
                                        <BaseButton
                                            className="w-7 h-7 rounded-lg bg-ash-dark-600 hover:bg-ash-dark-300 active:bg-ash-dark-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1]"
                                            onClick={revertToken}
                                        >
                                            <ICArrowDownRounded />
                                        </BaseButton>
                                    </div>
                                    <SwapAmount
                                        bottomRightCorner
                                        showQuickSelect={
                                            !!tokenFrom && !tokenTo
                                        }
                                        type="to"
                                        resetPivotToken={() =>
                                            setTokenFrom(undefined)
                                        }
                                        disableInput
                                    />
                                </div>
                            </MaiarPoolTooltip>

                            {tokenFrom && tokenTo && (
                                <OnboardTooltip
                                    open={!!valueFrom && onboardingFairPrice}
                                    placement="right"
                                    zIndex={10}
                                    onArrowClick={() =>
                                        setOnboaredFairPrice(true)
                                    }
                                    content={
                                        <OnboardTooltip.Panel>
                                            <div className="px-6 py-2.5 text-sm font-bold text-white">
                                                <span>More details for </span>
                                                <span className="text-stake-green-500">
                                                    Pro-Trader
                                                </span>
                                            </div>
                                        </OnboardTooltip.Panel>
                                    }
                                >
                                    <div
                                        className="flex flex-row justify-between text-xs text-white my-5"
                                        style={{ color: "#00FF75" }}
                                    >
                                        <div
                                            className="opacity-50 font-bold flex flex-row items-center gap-2 select-none cursor-pointer"
                                            onClick={() => {
                                                setIsOpenFairPrice(
                                                    (state) => !state
                                                );
                                                setOnboaredFairPrice(true);
                                            }}
                                        >
                                            <div>Fair price</div>
                                            <div>
                                                {isOpenFairPrice ? (
                                                    <ICChevronUp />
                                                ) : (
                                                    <ICChevronDown />
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            1 {tokenFrom?.symbol} ={" "}
                                            {pool && rates && (
                                                <TextAmt
                                                    number={
                                                        pool?.tokens[0].id ===
                                                        tokenFrom.id
                                                            ? toEGLD(
                                                                  pool
                                                                      .tokens[1],
                                                                  rates[0].toString()
                                                              )
                                                            : toEGLD(
                                                                  pool
                                                                      .tokens[0],
                                                                  rates[1].toString()
                                                              )
                                                    }
                                                    options={{
                                                        notation: "standard",
                                                    }}
                                                />
                                            )}{" "}
                                            {tokenTo?.symbol}
                                        </div>
                                    </div>
                                </OnboardTooltip>
                            )}

                            {isOpenFairPrice &&
                                pool &&
                                rawValueFrom.gt(new BigNumber(0)) && (
                                    <>
                                        <div className="bg-black flex flex-row items-center justify-between h-10 pl-5 pr-6">
                                            <CardTooltip
                                                content={
                                                    <div>
                                                        Making a trade shifts
                                                        the ratio of tokens in
                                                        the pool, causing this
                                                        change in price per
                                                        token.
                                                    </div>
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.swapResultLabel
                                                    }
                                                >
                                                    Price impact
                                                </div>
                                            </CardTooltip>
                                            <div
                                                className={
                                                    styles.swapResultValue
                                                }
                                                style={{ color: "#00FF75" }}
                                            >
                                                {formatAmount(priceImpact, {
                                                    notation: "standard",
                                                })}
                                                %
                                            </div>
                                        </div>
                                        <div className="bg-black flex flex-row items-center justify-between h-10 pl-5 pr-6">
                                            <CardTooltip
                                                content={
                                                    <div>
                                                        The minimum amount you
                                                        would get after
                                                        subtracting fees and
                                                        maximum slippage being
                                                        reached.
                                                    </div>
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.swapResultLabel
                                                    }
                                                >
                                                    Minimum received
                                                </div>
                                            </CardTooltip>
                                            <div
                                                className={
                                                    styles.swapResultValue
                                                }
                                            >
                                                <TextAmt
                                                    number={minimumReceive}
                                                    options={{
                                                        notation: "standard",
                                                    }}
                                                    decimalClassName="text-stake-gray-500"
                                                />
                                                &nbsp;{tokenTo?.symbol}
                                            </div>
                                        </div>
                                        <div className="bg-black flex flex-row items-center justify-between h-10 pl-5 pr-6">
                                            <CardTooltip
                                                content={
                                                    <div>
                                                        You can change this in
                                                        settings to either make
                                                        sure you get the amount
                                                        you want or your
                                                        transaction will not be
                                                        reverted.
                                                    </div>
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.swapResultLabel
                                                    }
                                                >
                                                    Slippage
                                                </div>
                                            </CardTooltip>
                                            <div
                                                className={
                                                    styles.swapResultValue
                                                }
                                            >
                                                {formatAmount(slippage * 100, {
                                                    notation: "standard",
                                                })}
                                                %
                                            </div>
                                        </div>
                                        <div className="bg-black flex flex-row items-center justify-between h-10 pl-5 pr-6">
                                            <CardTooltip
                                                content={
                                                    <div>
                                                        Which liquidity
                                                        providers earn from
                                                        successful transactions.
                                                        Don&apos;t worry,
                                                        It&apos;s small.
                                                    </div>
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.swapResultLabel
                                                    }
                                                >
                                                    Swap fees
                                                </div>
                                            </CardTooltip>
                                            {pool.isMaiarPool ? (
                                                <div
                                                    className={
                                                        styles.swapResultValue
                                                    }
                                                >
                                                    {tokenFrom &&
                                                    rawValueFrom ? (
                                                        <TextAmt
                                                            number={toEGLDD(
                                                                tokenFrom.decimals,
                                                                rawValueFrom.multipliedBy(
                                                                    fee
                                                                )
                                                            )}
                                                            options={{
                                                                notation:
                                                                    "standard",
                                                            }}
                                                            decimalClassName="text-stake-gray-500"
                                                        />
                                                    ) : (
                                                        "0.00"
                                                    )}{" "}
                                                    {tokenFrom?.symbol}
                                                </div>
                                            ) : (
                                                <div
                                                    className={
                                                        styles.swapResultValue
                                                    }
                                                >
                                                    {tokenTo && rawValueTo ? (
                                                        <TextAmt
                                                            number={toEGLDD(
                                                                tokenTo.decimals,
                                                                rawValueTo.multipliedBy(
                                                                    fee
                                                                )
                                                            )}
                                                            options={{
                                                                notation:
                                                                    "standard",
                                                            }}
                                                            decimalClassName="text-stake-gray-500"
                                                        />
                                                    ) : (
                                                        "0.00"
                                                    )}{" "}
                                                    {tokenTo?.symbol}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                            {mounted && (
                                <div className="border-notch-x border-notch-white/50 mt-12">
                                    <GlowingButton
                                        theme="pink"
                                        className="w-full clip-corner-1 clip-corner-tl uppercase h-12 text-xs sm:text-sm font-bold"
                                        disabled={
                                            swapping ||
                                            fetchingAmtOut ||
                                            isInsufficentFund ||
                                            isInsufficientEGLD
                                        }
                                        onClick={
                                            loggedIn
                                                ? swap
                                                : () => connectWallet()
                                        }
                                    >
                                        <div className="flex items-center space-x-2.5">
                                            {!loggedIn && <IconWallet />}
                                            {isInsufficentFund ||
                                            isInsufficientEGLD ? (
                                                <span className="text-text-input-3">
                                                    INSUFFICIENT{" "}
                                                    <span className="text-insufficent-fund">
                                                        {isInsufficientEGLD
                                                            ? "EGLD"
                                                            : tokenFrom?.symbol}
                                                    </span>{" "}
                                                    BALANCE
                                                </span>
                                            ) : (
                                                <span className="mt-0.5">
                                                    {loggedIn
                                                        ? "SWAP"
                                                        : "CONNECT WALLET"}
                                                </span>
                                            )}

                                            {loggedIn && <IconRight />}
                                        </div>
                                    </GlowingButton>
                                </div>
                            )}

                            <div
                                className="text-xs font-bold text-center"
                                style={{ marginTop: 34 }}
                            >
                                <span className="text-text-input-3">
                                    DON&apos;T KNOW HOW TO USE IT?{" "}
                                </span>
                                <a
                                    href="https://docs.ashswap.io/guides/swap-trade"
                                    target={"_blank"}
                                    rel="noreferrer"
                                    style={{ color: "#14E499" }}
                                >
                                    VISIT HERE!
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                {showSetting && !screenSize.isMobile && (
                    <div className="relative px-12 py-14 bg-ash-dark-600 sm:w-5/12 max-w-[23rem] text-white border-l border-l-ash-gray-600/50">
                        <div className="absolute top-4 right-4">
                            <IconButton
                                icon={<IconClose className="text-white" />}
                                iconSize="small"
                                onClick={() => setShowSetting(false)}
                            />
                        </div>
                        <Setting />
                    </div>
                )}
            </div>
            <HistoryModal
                open={isOpenHistoryModal}
                onClose={() => openHistoryModal(false)}
            />
            {screenSize.isMobile && (
                <BaseModal
                    isOpen={showSetting}
                    onRequestClose={() => setShowSetting(false)}
                    type="drawer_btt"
                    className="clip-corner-4 clip-corner-tl bg-ash-dark-600 p-4 text-white flex flex-col max-h-full"
                >
                    <div className="flex justify-end">
                        <BaseModal.CloseBtn />
                    </div>
                    <Setting />
                    <BaseButton
                        theme="pink"
                        className="uppercase text-xs font-bold mt-10 h-12 w-full"
                        onClick={() => setShowSetting(false)}
                    >
                        Confirm
                    </BaseButton>
                </BaseModal>
            )}
        </div>
    );
};

export default Swap;
