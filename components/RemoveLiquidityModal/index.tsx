import {
    Address,
    ArgSerializer,
    BigUIntValue,
    ContractFunction,
    EndpointParameterDefinition,
    Query,
    TypeExpressionParser,
    TypeMapper
} from "@elrondnetwork/erdjs";
import { Slider } from "antd";
import IconRight from "assets/svg/right-yellow.svg";
import { accIsInsufficientEGLDState } from "atoms/dappState";
import { PoolsState } from "atoms/poolsState";
import { walletLPMapState } from "atoms/walletState";
import BigNumber from "bignumber.js";
import Avatar from "components/Avatar";
import BaseModal from "components/BaseModal";
import GlowingButton from "components/GlowingButton";
import InputCurrency from "components/InputCurrency";
import TextAmt from "components/TextAmt";
import Token from "components/Token";
import OnboardTooltip from "components/Tooltip/OnboardTooltip";
import { useSwap } from "context/swap";
import { toEGLD, toEGLDD, toWei } from "helper/balance";
import { getProxyNetworkProvider } from "helper/proxy/util";
import { useCreateTransaction } from "helper/transactionMethods";
import { useFetchBalances } from "hooks/useFetchBalances";
import { useOnboarding } from "hooks/useOnboarding";
import usePoolRemoveLP from "hooks/usePoolContract/usePoolRemoveLP";
import { useScreenSize } from "hooks/useScreenSize";
import { Unarray } from "interface/utilities";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRecoilValue } from "recoil";
import { theme } from "tailwind.config";
import { useDebounce } from "use-debounce";

interface Props {
    open?: boolean;
    onClose?: () => void;
    poolData: Unarray<PoolsState["poolToDisplay"]>;
}
const RemoveLPContent = ({ open, onClose, poolData }: Props) => {
    const { pool, poolStats, liquidityData } = poolData;
    const { capacityPercent, ownLiquidity } = liquidityData!;
    const { total_value_locked } = poolStats || {};
    const [liquidity, setLiquidity] = useState<BigNumber>(new BigNumber(0));
    const [totalUsd, setTotalUsd] = useState<BigNumber>(new BigNumber(0));
    const [liquidityPercent, setLiquidityPercent] = useState<number>(0);
    const [value0, setValue0] = useState<string>("");
    const [value1, setValue1] = useState<string>("");
    const [liquidityDebounce] = useDebounce(liquidity, 500);
    const screenSize = useScreenSize();
    const fetchBalances = useFetchBalances();
    const lpTokens = useRecoilValue(walletLPMapState);
    const insufficientEGLD = useRecoilValue(accIsInsufficientEGLDState);
    const createTx = useCreateTransaction();
    const { slippage } = useSwap();
    const [displayInputLiquidity, setDisplayInputLiquidity] =
        useState<string>("");
    const [removing, setRemoving] = useState(false);
    const proxy = getProxyNetworkProvider();
    const [onboardingWithdrawInput, setOnboardedWithdrawInput] = useOnboarding(
        "pool_withdraw_input"
    );
    const removePoolLP = usePoolRemoveLP();

    const pricePerLP = useMemo(() => {
        // warning: mocking - change to 0 after pool analytic API success
        if (!total_value_locked) return new BigNumber(0);
        const lpToken = lpTokens[pool.lpToken.id];
        if (!total_value_locked || !lpToken?.totalSupply) {
            return new BigNumber(0);
        }
        return new BigNumber(total_value_locked).div(
            toEGLDD(
                pool.lpToken.decimals,
                lpTokens[pool.lpToken.id].totalSupply!
            )
        );
    }, [total_value_locked, lpTokens, pool]);

    // real LP
    const shortOwnLP = useMemo(() => {
        return toEGLD(pool.lpToken, ownLiquidity.toString());
    }, [pool.lpToken, ownLiquidity]);

    // verify input $ and set the new valid $ value
    const computeValidTotalUsd = useCallback(
        (val: BigNumber) => {
            if (val.div(pricePerLP).div(shortOwnLP).gte(0.998)) {
                const validVal = shortOwnLP.multipliedBy(pricePerLP);
                setDisplayInputLiquidity(validVal.toString(10));
                return validVal;
            }
            return val;
        },
        [pricePerLP, shortOwnLP]
    );

    // re-validate totalUSD on pricePerLP, ownLp changes
    useEffect(() => {
        setTotalUsd((val) => computeValidTotalUsd(val));
    }, [computeValidTotalUsd]);

    // calculate % LP tokens - source of truth: totalUsd
    useEffect(() => {
        const pct = totalUsd
            .div(pricePerLP)
            .div(shortOwnLP)
            .multipliedBy(100)
            .toNumber();
        setLiquidityPercent(pct);
    }, [pricePerLP, totalUsd, shortOwnLP]);

    // only set liquidty base on liquidity percent - source of truth: liquidityPercent
    useEffect(() => {
        setLiquidity(
            new BigNumber(
                ownLiquidity.multipliedBy(liquidityPercent).div(100).toFixed(0)
            )
        );
    }, [ownLiquidity, liquidityPercent]);

    // set liquidityPercent indirectly through totalUsd
    const onChangeLiquidityPercent = useCallback(
        (percent: number) => {
            const valid = computeValidTotalUsd(
                shortOwnLP
                    .multipliedBy(percent)
                    .div(100)
                    .multipliedBy(pricePerLP)
            );
            setDisplayInputLiquidity(valid.toString(10));
            setTotalUsd(valid);
        },
        [pricePerLP, shortOwnLP, computeValidTotalUsd]
    );

    useEffect(() => {
        if (!proxy || liquidityDebounce.eq(0) || liquidityDebounce.isNaN()) {
            return;
        }

        proxy
            .queryContract(
                new Query({
                    address: new Address(pool.address),
                    func: new ContractFunction("getRemoveLiquidityTokens"),
                    args: [
                        new BigUIntValue(liquidityDebounce),
                        new BigUIntValue(new BigNumber(0)),
                        new BigUIntValue(new BigNumber(0)),
                    ],
                })
            )
            .then(({ returnData }) => {
                let resultHex = Buffer.from(returnData[0], "base64").toString(
                    "hex"
                );
                let parser = new TypeExpressionParser();
                let mapper = new TypeMapper();
                let serializer = new ArgSerializer();

                let type = parser.parse("tuple2<BigUint,BigUint>");
                let mappedType = mapper.mapType(type);

                let endpointDefinitions = [
                    new EndpointParameterDefinition("foo", "bar", mappedType),
                ];
                let values = serializer.stringToValues(
                    resultHex,
                    endpointDefinitions
                );

                setValue0(
                    toEGLD(
                        pool.tokens[0],
                        values[0].valueOf().field0.toString()
                    ).toString()
                );
                setValue1(
                    toEGLD(
                        pool.tokens[1],
                        values[0].valueOf().field1.toString()
                    ).toString()
                );
            })
            .catch((error) => console.log(error));
    }, [liquidityDebounce, pool, proxy]);

    const removeLP = useCallback(async () => {
        if (removing || liquidity.eq(0)) return;
        setRemoving(true);
        try {
            const [token0, token1] = pool.tokens;
            const { sessionId } = await removePoolLP(
                pool,
                liquidity,
                toWei(token0, value0),
                toWei(token1, value1),
                slippage
            );
            if (sessionId) onClose?.();
        } catch (error) {
            // TODO: extension close without response
            console.error(error);
        } finally {
            setRemoving(false);
        }
    }, [
        value0,
        value1,
        slippage,
        pool,
        onClose,
        liquidity,
        removing,
        removePoolLP,
    ]);

    return (
        <div className="px-8 pt-6 pb-16 sm:pb-7">
            <div className="flex flex-row items-center mb-3">
                <div className="mr-3">
                    <div className="text-text-input-3 text-xs">
                        {pool.tokens[0].symbol} & {pool.tokens[1].symbol}
                    </div>
                </div>
                <div className="flex flex-row justify-between items-center">
                    <Avatar
                        src={pool.tokens[0].icon}
                        alt={pool.tokens[0].symbol}
                        className="w-3.5 h-3.5"
                    />
                    <Avatar
                        src={pool.tokens[1].icon}
                        alt={pool.tokens[1].symbol}
                        className="w-3.5 h-3.5 -ml-1"
                    />
                </div>
            </div>
            <div className="flex items-baseline text-2xl font-bold text-yellow-700">
                Withdraw Liquidity
            </div>
            <div className="mt-8 mb-12 sm:my-10">
                <div className="relative mb-11 sm:mb-0">
                    <div>
                        <OnboardTooltip
                            open={onboardingWithdrawInput && screenSize.md}
                            placement="left"
                            onArrowClick={() => setOnboardedWithdrawInput(true)}
                            content={({ size }) => (
                                <OnboardTooltip.Panel
                                    size={size}
                                    className="w-36"
                                >
                                    <div className="p-3 text-xs font-bold">
                                        <span className="text-stake-green-500">
                                            Input{" "}
                                        </span>
                                        <span>value or </span>
                                        <span className="text-stake-green-500">
                                            touch the slider
                                        </span>
                                    </div>
                                </OnboardTooltip.Panel>
                            )}
                        >
                            <div className="flex items-center space-x-1 bg-ash-dark-700 sm:bg-transparent pl-4 sm:pl-0">
                                <div className="flex items-center font-bold w-24 shrink-0 border-r border-r-ash-gray-500 sm:border-r-0">
                                    <IconRight className="mr-4" />
                                    <span>TOTAL</span>
                                </div>
                                <div className="flex-1 flex items-center overflow-hidden bg-ash-dark-700 text-right text-lg h-[4.5rem] px-5 ">
                                    <InputCurrency
                                        className="bg-transparent text-right grow outline-none"
                                        placeholder="0"
                                        value={displayInputLiquidity}
                                        onChange={(e) => {
                                            const value = e.target.value || "";
                                            setDisplayInputLiquidity(value);
                                            setTotalUsd(
                                                computeValidTotalUsd(
                                                    new BigNumber(
                                                        value.startsWith(".")
                                                            ? "0" + value
                                                            : value || "0"
                                                    )
                                                )
                                            );
                                            setOnboardedWithdrawInput(true);
                                        }}
                                    />
                                    <div className="text-ash-gray-500 ml-2">
                                        $
                                    </div>
                                </div>
                            </div>
                        </OnboardTooltip>

                        <div className="flex flex-row items-center">
                            <div className="sm:w-24"></div>
                            <div className="flex flex-row items-center flex-1 gap-4">
                                <div>0%</div>
                                <Slider
                                    className="ash-slider pt-4 w-full"
                                    step={1}
                                    marks={{
                                        0: "",
                                        25: "",
                                        50: "",
                                        75: "",
                                        100: "",
                                    }}
                                    handleStyle={{
                                        backgroundColor: "#191629",
                                        borderRadius: 0,
                                        border:
                                            "2px solid " +
                                            theme.extend.colors.slider.track,
                                        width: 7,
                                        height: 7,
                                    }}
                                    min={0}
                                    max={100}
                                    value={liquidityPercent}
                                    onChange={(e) => {
                                        onChangeLiquidityPercent(e);
                                        setOnboardedWithdrawInput(true);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="my-1.5">
                            <div className="flex items-center flex-row space-x-1 bg-ash-dark-700 sm:bg-transparent pl-4 sm:pl-0">
                                <Token
                                    token={pool.tokens[0]}
                                    className="w-24 border-r border-r-ash-gray-500 sm:border-r-0"
                                />
                                <InputCurrency
                                    className="flex-1 overflow-hidden bg-ash-dark-700 text-right text-lg h-12 px-5 outline-none"
                                    placeholder="0"
                                    value={value0}
                                    disabled
                                />
                            </div>
                            <div className="py-2 text-2xs sm:text-sm text-text-input-3 text-right">
                                <span>Available: </span>
                                <span className="text-earn">
                                    <TextAmt
                                        number={toEGLDD(
                                            pool.tokens[0].decimals,
                                            liquidityData?.value0 || 0
                                        )}
                                        options={{ notation: "standard" }}
                                    />{" "}
                                    {pool.tokens[0].symbol}
                                </span>
                            </div>
                        </div>

                        <div className="my-1.5">
                            <div className="flex items-center flex-row space-x-1 bg-ash-dark-700 sm:bg-transparent pl-4 sm:pl-0">
                                <Token
                                    token={pool.tokens[1]}
                                    className="w-24 border-r border-r-ash-gray-500 sm:border-r-0"
                                />
                                <InputCurrency
                                    className="flex-1 overflow-hidden bg-ash-dark-700 text-right text-lg h-12 px-5 outline-none"
                                    placeholder="0"
                                    value={value1}
                                    disabled
                                />
                            </div>
                            <div className="py-2 text-2xs sm:text-sm text-text-input-3 text-right">
                                <span>Available: </span>
                                <span className="text-earn">
                                    <TextAmt
                                        number={toEGLDD(
                                            pool.tokens[1].decimals,
                                            liquidityData?.value1 || 0
                                        )}
                                        options={{ notation: "standard" }}
                                    />{" "}
                                    {pool.tokens[1].symbol}
                                </span>
                            </div>
                        </div>

                        <div className="absolute left-4 sm:left-0 text-sm top-14 sm:top-[4rem]">
                            &
                        </div>
                    </div>
                </div>
            </div>

            <div className="sm:flex justify-end md:gap-8">
                <div className="sm:w-1/2 md:w-1/3">
                    <div className="border-notch-x border-notch-white/50 mt-1.5">
                        <GlowingButton
                            theme="yellow"
                            className="w-full h-12 font-bold clip-corner-1 clip-corner-tl"
                            onClick={removeLP}
                            disabled={removing || liquidity.eq(0)}
                        >
                            {insufficientEGLD
                                ? "INSUFFICIENT EGLD BALANCE"
                                : "WITHDRAW"}
                        </GlowingButton>
                    </div>
                </div>
            </div>
        </div>
    );
};
const RemoveLiquidityModal = ({ open, onClose, poolData }: Props) => {
    const screenSize = useScreenSize();
    return (
        <BaseModal
            isOpen={!!open}
            onRequestClose={() => onClose && onClose()}
            type={screenSize.msm ? "drawer_btt" : "modal"}
            className="clip-corner-4 clip-corner-tl bg-ash-dark-600 p-4
                    sm:mt-28 max-w-4xl mx-auto
                    fixed sm:relative inset-x-0 bottom-0 max-h-screen overflow-auto text-white flex flex-col"
        >
            <div className="flex justify-end">
                <BaseModal.CloseBtn />
            </div>
            <div className="grow overflow-auto">
                <RemoveLPContent
                    open={open}
                    onClose={onClose}
                    poolData={poolData}
                />
            </div>
        </BaseModal>
    );
};

export default RemoveLiquidityModal;
