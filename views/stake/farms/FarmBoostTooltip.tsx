import { AccountInfoSliceNetworkType } from "@elrondnetwork/dapp-core/types";
import ICChevronRight from "assets/svg/chevron-right.svg";
import { accAddressState, networkConfigState } from "atoms/dappState";
import { FarmRecord } from "atoms/farmsState";
import BigNumber from "bignumber.js";
import TextAmt from "components/TextAmt";
import CardTooltip from "components/Tooltip/CardTooltip";
import pools from "const/pool";
import { toEGLDD } from "helper/balance";
import { formatAmount } from "helper/number";
import { useMemo } from "react";
import { useRecoilValue } from "recoil";
const EstimateInUSD = ({
    number,
    className,
}: {
    number: BigNumber.Value;
    className?: string;
}) => {
    return (
        <span className={className}>
            <span className="text-stake-gray-500">~ $</span>
            <TextAmt
                number={number}
                decimalClassName={`${
                    new BigNumber(number).gt(0) ? "text-stake-gray-500" : ""
                }`}
            />
        </span>
    );
};
function FarmBoostTooltip({
    children,
    booster,
    farmData,
    lpAmt,
    onSelfBoostTransferedToken,
}: {
    children: any;
    booster: string;
    farmData: FarmRecord;
    lpAmt: BigNumber;
    onSelfBoostTransferedToken?: () => {};
}) {
    const farm = farmData.farm;
    const pool = useMemo(() => {
        return pools.find((p) => p.lpToken.id === farm.farming_token_id);
    }, [farm]);
    const accAddress = useRecoilValue(accAddressState);
    const networkConfig: AccountInfoSliceNetworkType =
        useRecoilValue(networkConfigState).network;
    const isOwner = useMemo(
        () => booster === accAddress,
        [booster, accAddress]
    );
    return (
        <CardTooltip
            placement="right"
            content={
                <div className="max-w-xs px-6 py-2">
                    <div className="mb-12">
                        <div className="text-xs font-bold mb-4 text-stake-gray-500">
                            Owner & boosted by
                        </div>
                        <div className="text-lg font-bold text-white mb-1">
                            {isOwner ? "Yourself" : "Sender"}
                        </div>
                        <a
                            href={`${networkConfig.explorerAddress}/accounts/${booster}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <span className="text-sm font-bold text-white underline">
                                {booster.slice(0, 8)}
                                ...{booster.slice(-8)}
                            </span>
                        </a>
                    </div>

                    <div>
                        <div className="text-xs font-bold mb-4 text-stake-gray-500">
                            Account
                        </div>
                        <div className="text-lg font-bold text-white mb-1">
                            {formatAmount(
                                toEGLDD(
                                    farm.farming_token_decimal,
                                    lpAmt
                                ).toNumber(),
                                { notation: "standard" }
                            )}{" "}
                            {pool!.lpToken.symbol}
                        </div>
                        <div>
                            <EstimateInUSD
                                number={farmData.totalLiquidityValue
                                    .multipliedBy(lpAmt)
                                    .div(farmData.lpLockedAmt)}
                            />
                        </div>
                    </div>
                    {!isOwner && (
                        <button
                            className="inline-flex items-center text-pink-600 text-xs font-bold mt-12"
                            onClick={() => onSelfBoostTransferedToken?.()}
                        >
                            <span className="mr-4">
                                I want to boost by my self
                            </span>
                            <ICChevronRight className="w-1.5 h-auto" />
                        </button>
                    )}
                </div>
            }
        >
            {children}
        </CardTooltip>
    );
}

export default FarmBoostTooltip;
