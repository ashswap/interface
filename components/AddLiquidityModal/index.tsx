import IconRight from "assets/svg/right-white.svg";
import { addLPSessionIdAtom } from "atoms/addLiquidity";
import {
    accIsInsufficientEGLDState,
    accIsLoggedInState
} from "atoms/dappState";
import { PoolsState } from "atoms/poolsState";
import { walletBalanceState, walletTokenPriceState } from "atoms/walletState";
import BigNumber from "bignumber.js";
import Avatar from "components/Avatar";
import BaseModal from "components/BaseModal";
import Checkbox from "components/Checkbox";
import GlowingButton from "components/GlowingButton";
import InputCurrency from "components/InputCurrency";
import TextAmt from "components/TextAmt";
import OnboardTooltip from "components/Tooltip/OnboardTooltip";
import { toEGLDD, toWei } from "helper/balance";
import { getProxyNetworkProvider } from "helper/proxy/util";
import { useCreateTransaction } from "helper/transactionMethods";
import { useOnboarding } from "hooks/useOnboarding";
import usePoolAddLP from "hooks/usePoolContract/usePoolAddLP";
import { useScreenSize } from "hooks/useScreenSize";
import { IToken } from "interface/token";
import { Unarray } from "interface/utilities";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { theme } from "tailwind.config";
import { useDebounce } from "use-debounce";

interface Props {
    open?: boolean;
    onClose?: () => void;
    poolData: Unarray<PoolsState["poolToDisplay"]>;
}
interface TokenInputProps {
    token: IToken;
    value: string;
    isInsufficentFund: boolean;
    onChangeValue: (val: string) => void;
    balance: string;
    tokenInPool: BigNumber;
}
const TokenInput = ({
    token,
    value,
    isInsufficentFund,
    onChangeValue,
    balance,
    tokenInPool,
}: TokenInputProps) => {
    return (
        <>
            <div className="bg-ash-dark-700 sm:bg-transparent flex space-x-1 items-center sm:items-stretch">
                <div
                    className={`flex items-center w-24 sm:w-1/3 px-4 sm:px-0 border-r border-r-ash-gray-500 sm:border-r-0`}
                >
                    <Avatar
                        src={token.icon}
                        alt="token icon"
                        className="w-5 h-5 mr-2 shrink-0"
                    />
                    <div className="hidden sm:block overflow-hidden">
                        <div className="text-sm font-bold text-white sm:pb-1">
                            {token.symbol}
                        </div>
                        <div className="text-text-input-3 text-xs truncate leading-tight">
                            <TextAmt number={tokenInPool} />
                            &nbsp; in pool
                        </div>
                    </div>
                    <div className="block sm:hidden text-xs font-bold text-white">
                        {token.symbol}
                    </div>
                </div>

                <InputCurrency
                    className="flex-1 overflow-hidden bg-ash-dark-700 text-white text-right text-lg outline-none px-5 h-12"
                    placeholder="0"
                    value={value}
                    style={{
                        border: isInsufficentFund
                            ? `1px solid ${theme.extend.colors["insufficent-fund"]}`
                            : "",
                    }}
                    onChange={(e) => onChangeValue(e.target.value)}
                />
            </div>
            <div
                className="flex flex-row justify-between py-2 text-text-input-3 text-right"
                style={{ fontSize: 10 }}
            >
                <div style={{ marginLeft: "33.333%" }}>
                    {isInsufficentFund && (
                        <span>
                            Insufficient fund -{" "}
                            <Link href="/swap" passHref>
                                <span className="text-insufficent-fund select-none cursor-pointer">
                                    Go trade!
                                </span>
                            </Link>
                        </span>
                    )}
                </div>
                <div>
                    <span>Balance: </span>
                    <span
                        className="text-earn select-none cursor-pointer"
                        onClick={() => onChangeValue(balance)}
                    >
                        <TextAmt
                            number={balance}
                            options={{ notation: "standard" }}
                        />
                        &nbsp;
                        {token.symbol}
                    </span>
                </div>
            </div>
        </>
    );
};
const AddLiquidityContent = ({ open, onClose, poolData }: Props) => {
    const [isAgree, setAgree] = useState<boolean>(false);
    const [value0, setValue0] = useState<string>("");
    const [value0Debounce] = useDebounce(value0, 500);
    const [value1, setValue1] = useState<string>("");
    const [value1Debounce] = useDebounce(value1, 500);
    const [isProMode, setIsProMode] = useState(false);
    const [adding, setAdding] = useState(false);
    const createTx = useCreateTransaction();
    const addPoolLP = usePoolAddLP();
    // recoil
    const balances = useRecoilValue(walletBalanceState);
    const tokenPrices = useRecoilValue(walletTokenPriceState);
    // end recoil
    const loggedIn = useRecoilValue(accIsLoggedInState);
    const isInsufficientEGLD = useRecoilValue(accIsInsufficientEGLDState);
    const proxy = getProxyNetworkProvider();
    const { pool, poolStats, liquidityData } = poolData;
    const [onboardingDepositInput, setOnboardedDepositInput] =
        useOnboarding("pool_deposit_input");
    const [onboardingPoolCheck, setOnboardedPoolCheck] = useOnboarding(
        "pool_deposit_checkbox"
    );

    const setAddLPSessionId = useSetRecoilState(addLPSessionIdAtom);
    const screenSize = useScreenSize();
    // reset when open modal
    useEffect(() => {
        if (open) {
            setAgree(false);
            setValue0("");
            setValue1("");
        }
    }, [open]);

    useEffect(() => {
        if (new BigNumber(value0 || 0).plus(new BigNumber(value1 || 0)).gt(0)) {
            setOnboardedDepositInput(true);
        }
    }, [value0, value1, setOnboardedDepositInput]);

    const addLP = useCallback(async () => {
        if (!loggedIn || adding) return;
        setAdding(true);
        const v0 = toWei(pool.tokens[0], value0 || "0");
        const v1 = toWei(pool.tokens[1], value1 || "0");
        try {
            const { sessionId } = await addPoolLP(pool, v0, v1);
            setAddLPSessionId(sessionId || "");
            if (sessionId) onClose?.();
        } catch (error) {
            console.error(error);
        } finally {
            setAdding(false);
        }
    }, [
        value0,
        value1,
        pool,
        onClose,
        adding,
        loggedIn,
        addPoolLP,
        setAddLPSessionId,
    ]);

    const balance0 = useMemo(() => {
        return (
            balances[pool.tokens[0].id]?.balance
                .div(new BigNumber(10).exponentiatedBy(pool.tokens[0].decimals))
                .toFixed(8)
                .toString() || "0"
        );
    }, [balances, pool]);

    const balance1 = useMemo(() => {
        return (
            balances[pool.tokens[1].id]?.balance
                .div(new BigNumber(10).exponentiatedBy(pool.tokens[1].decimals))
                .toFixed(8)
                .toString() || "0"
        );
    }, [balances, pool]);

    const isInsufficentFund0 = useMemo(() => {
        if (value0 === "" || balance0 === "0") {
            return false;
        }

        const v0 = new BigNumber(value0);
        const b0 = new BigNumber(balance0);

        return v0.gt(b0);
    }, [value0, balance0]);

    const isInsufficentFund1 = useMemo(() => {
        if (value1 === "" || balance1 === "0") {
            return false;
        }

        const v1 = new BigNumber(value1);
        const b1 = new BigNumber(balance1);

        return v1.gt(b1);
    }, [value1, balance1]);

    // useEffect(() => {
    //     if (value0Debounce === "" || value1Debounce === "") {
    //         return;
    //     }

    //     proxy
    //         .queryContract(
    //             new Query({
    //                 address: new Address(pool.address),
    //                 func: new ContractFunction("getAddLiquidityTokens"),
    //                 args: [
    //                     new BigUIntValue(
    //                         new BigNumber(toWei(pool.tokens[0], value0Debounce))
    //                     ),
    //                     new BigUIntValue(
    //                         new BigNumber(toWei(pool.tokens[1], value1Debounce))
    //                     )
    //                 ]
    //             })
    //         )
    //         .then(({ returnData }) => {

    //             let liquidity = new BigNumber(
    //                 "0x" + Buffer.from(returnData[0], "base64").toString("hex")
    //             );

    //             setLiquidity(
    //                 toEGLD(pool.lpToken, liquidity.toString()).toFixed(8)
    //             );
    //         });
    // }, [value0Debounce, value1Debounce, pool, proxy]);

    const liquidityValue = useMemo(() => {
        if (!value0Debounce && !value1Debounce) {
            return new BigNumber(0);
        }

        let token0 = pool.tokens[0];
        let token1 = pool.tokens[1];

        let balance0 = new BigNumber(value0Debounce || "0");
        let balance1 = new BigNumber(value1Debounce || "0");

        const valueUsd0 = balance0.multipliedBy(tokenPrices[token0.id]);
        const valueUsd1 = balance1.multipliedBy(tokenPrices[token1.id]);

        return valueUsd0.plus(valueUsd1) || new BigNumber(0);
    }, [pool, tokenPrices, value0Debounce, value1Debounce]);

    const canAddLP = useMemo(() => {
        const v0 = new BigNumber(value0 || "0");
        const v1 = new BigNumber(value1 || "0");
        return (
            isAgree &&
            !isInsufficientEGLD &&
            !isInsufficentFund0 &&
            !isInsufficentFund1 &&
            !adding &&
            !v0.plus(v1).eq(0)
        );
    }, [
        isAgree,
        isInsufficentFund0,
        isInsufficentFund1,
        isInsufficientEGLD,
        adding,
        value0,
        value1,
    ]);

    return (
        <div className="px-8 pb-16 sm:pb-7 grow overflow-auto">
            <div className="inline-flex justify-between items-center">
                <div className="mr-2">
                    {/* <div className="text-text-input-3 text-xs">Deposit</div> */}
                    <div className="flex flex-row items-baseline text-lg sm:text-2xl font-bold">
                        <span>{pool.tokens[0].symbol}</span>
                        <span className="text-sm px-3">&</span>
                        <span>{pool.tokens[1].symbol}</span>
                    </div>
                </div>
                <div className="flex flex-row justify-between items-center">
                    <Avatar
                        src={pool.tokens[0].icon}
                        alt={pool.tokens[0].symbol}
                        className="w-6 h-6 sm:w-9 sm:h-9"
                    />
                    <Avatar
                        src={pool.tokens[1].icon}
                        alt={pool.tokens[1].symbol}
                        className="w-6 h-6 sm:w-9 sm:h-9 -ml-1 sm:ml-[-0.375rem]"
                    />
                </div>
            </div>
            <div className="my-10">
                <div className="relative">
                    <OnboardTooltip
                        open={onboardingDepositInput && screenSize.md}
                        placement="left"
                        onArrowClick={() => setOnboardedDepositInput(true)}
                        content={({ size }) => (
                            <OnboardTooltip.Panel size={size} className="w-36">
                                <div className="p-3 text-xs font-bold">
                                    <span className="text-stake-green-500">
                                        Input value{" "}
                                    </span>
                                    <span>that you want to deposit</span>
                                </div>
                            </OnboardTooltip.Panel>
                        )}
                    >
                        <div>
                            <div className="py-1.5">
                                <TokenInput
                                    token={pool.tokens[0]}
                                    tokenInPool={toEGLDD(
                                        pool.tokens[0].decimals,
                                        liquidityData?.value0 || 0
                                    )}
                                    value={value0}
                                    onChangeValue={(val) => setValue0(val)}
                                    isInsufficentFund={isInsufficentFund0}
                                    balance={balance0}
                                />
                            </div>
                            <div className="py-1.5">
                                <TokenInput
                                    token={pool.tokens[1]}
                                    tokenInPool={toEGLDD(
                                        pool.tokens[1].decimals,
                                        liquidityData?.value1 || 0
                                    )}
                                    value={value1}
                                    onChangeValue={(val) => setValue1(val)}
                                    isInsufficentFund={isInsufficentFund1}
                                    balance={balance1}
                                />
                            </div>
                        </div>
                    </OnboardTooltip>

                    <div className="flex items-center space-x-1 bg-ash-dark-700 sm:bg-transparent mb-11 sm:mb-0">
                        <div className="flex items-center font-bold w-24 sm:w-1/3 px-4 sm:px-0 border-r border-r-ash-gray-500 sm:border-r-0">
                            <IconRight className="mr-4" />
                            <span>TOTAL</span>
                        </div>
                        <div className="flex-1 overflow-hidden bg-ash-dark-700 text-right text-lg h-[4.5rem] px-5 outline-none flex items-center justify-end">
                            <span>
                                <span className="text-ash-gray-500">$ </span>
                                <TextAmt
                                    number={liquidityValue}
                                    options={{ notation: "standard" }}
                                    decimalClassName="text-stake-gray-500"
                                />
                            </span>
                        </div>
                    </div>

                    <div className="absolute left-0 ml-2" style={{ top: 62 }}>
                        &
                    </div>
                </div>
            </div>

            <div className="sm:flex gap-8">
                <OnboardTooltip
                    open={
                        onboardingPoolCheck &&
                        !onboardingDepositInput &&
                        screenSize.md
                    }
                    placement="bottom-start"
                    onArrowClick={() => setOnboardedPoolCheck(true)}
                    arrowStyle={() => ({ left: 0 })}
                    content={({ size }) => (
                        <OnboardTooltip.Panel size={size} className="w-36">
                            <div className="p-3 text-xs font-bold">
                                <span className="text-stake-green-500">
                                    Click check box{" "}
                                </span>
                                <span>to verify your actions</span>
                            </div>
                        </OnboardTooltip.Panel>
                    )}
                >
                    <div>
                        <Checkbox
                            className="w-full mb-12 sm:mb-0 sm:w-2/3"
                            checked={isAgree}
                            onChange={(val) => {
                                setAgree(val);
                                setOnboardedPoolCheck(true);
                            }}
                            text={
                                <span>
                                    I verify that I have read the{" "}
                                    <a
                                        href="https://docs.ashswap.io/guides/add-remove-liquidity"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <b className="text-white">
                                            <u>AshSwap Pools Guide</u>
                                        </b>
                                    </a>{" "}
                                    and understand the risks of providing
                                    liquidity, including impermanent loss.
                                </span>
                            }
                        />
                    </div>
                </OnboardTooltip>

                <div className="w-full sm:w-1/3">
                    <div className="border-notch-x border-notch-white/50">
                        <GlowingButton
                            theme="pink"
                            className="w-full h-12 uppercase font-bold clip-corner-1 clip-corner-tl"
                            wrapperClassName="hover:colored-drop-shadow-xs"
                            disabled={!canAddLP}
                            onClick={canAddLP ? addLP : () => {}}
                        >
                            {isInsufficientEGLD
                                ? "INSUFFICIENT EGLD BALANCE"
                                : "DEPOSIT"}
                        </GlowingButton>
                    </div>
                </div>
            </div>
        </div>
    );
};
const AddLiquidityModal = (props: Props) => {
    const { open, onClose, poolData } = props;
    const screenSize = useScreenSize();
    return (
        <BaseModal
            isOpen={!!open}
            onRequestClose={() => onClose && onClose()}
            type={screenSize.msm ? "drawer_btt" : "modal"}
            className={`clip-corner-4 clip-corner-tl bg-ash-dark-600 text-white p-4 flex flex-col max-h-full max-w-4xl mx-auto`}
        >
            <div className="flex justify-end mb-6">
                <BaseModal.CloseBtn />
            </div>
            <div className="grow overflow-auto">
                <AddLiquidityContent {...props} />
            </div>
        </BaseModal>
    );
};

export default AddLiquidityModal;
