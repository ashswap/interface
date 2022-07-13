import {
    Address,
    AddressValue,
    BigUIntValue,
    ContractFunction,
    TokenIdentifierValue,
    TypedValue,
} from "@elrondnetwork/erdjs/out";
import { accAddressState, accIsLoggedInState } from "atoms/dappState";
import {
    farmRecordsState,
    farmSessionIdMapState,
    FarmToken,
} from "atoms/farmsState";
import BigNumber from "bignumber.js";
import { toEGLDD } from "helper/balance";
import {
    sendTransactions,
    useCreateTransaction,
} from "helper/transactionMethods";
import { DappSendTransactionsPropsType } from "interface/dappCore";
import { IFarm } from "interface/farm";
import { TokenPayment } from "interface/tokenPayment";
import { useRecoilCallback } from "recoil";
import useFarmReward from "./useFarmReward";
const calcUnstakeEntries = (weiAmt: BigNumber, farmTokens: FarmToken[]) => {
    let sum = new BigNumber(0);
    return farmTokens
        .map((ft) => {
            if (sum.gte(weiAmt)) {
                return { unstakeAmt: new BigNumber(0), farmToken: ft };
            }
            const remain = weiAmt.minus(sum);
            const lpBalance = ft.balance
                .div(ft.perLP)
                .integerValue(BigNumber.ROUND_FLOOR);
            const amt = lpBalance.lte(remain) ? lpBalance : remain;
            sum = sum.plus(amt);
            return {
                unstakeAmt: amt.eq(remain)
                    ? amt
                          .multipliedBy(ft.perLP)
                          .integerValue(BigNumber.ROUND_FLOOR)
                    : ft.balance,
                farmToken: ft,
            };
        })
        .filter(({ unstakeAmt }) => unstakeAmt.gt(0));
};
const useExitFarm = () => {
    const createTransaction = useCreateTransaction();
    const getReward = useFarmReward();

    const createExitFarmTx = useRecoilCallback(
        ({ snapshot, set }) =>
            async (
                lpAmt: BigNumber,
                collection: string,
                nonce: BigNumber,
                farm: IFarm
            ) => {
                const loggedIn = await snapshot.getPromise(accIsLoggedInState);
                const address = await snapshot.getPromise(accAddressState);

                if (!loggedIn) throw new Error("Connect wallet to exit farm");
                return await createTransaction(new Address(address), {
                    func: new ContractFunction("ESDTNFTTransfer"),
                    gasLimit: 8_000_000,
                    args: [
                        new TokenIdentifierValue(collection),
                        new BigUIntValue(nonce),
                        new BigUIntValue(lpAmt),
                        new AddressValue(new Address(farm.farm_address)),
                        new TokenIdentifierValue("exitFarm"),
                    ],
                });
            },
        []
    );

    const createExitFarmTxMulti = useRecoilCallback(
        ({ snapshot }) =>
            async (tokens: Array<Required<TokenPayment>>, farm: IFarm) => {
                const loggedIn = await snapshot.getPromise(accIsLoggedInState);
                const address: string = await snapshot.getPromise(
                    accAddressState
                );

                if (!loggedIn)
                    throw new Error("Connect wallet to claim reward");

                const farmTokenArgs = tokens.reduce(
                    (total: TypedValue[], val) => {
                        total = [
                            ...total,
                            new TokenIdentifierValue(val.collection),
                            new BigUIntValue(val.nonce),
                            new BigUIntValue(
                                val.amount.integerValue(BigNumber.ROUND_FLOOR)
                            ),
                        ];
                        return total;
                    },
                    []
                );
                return await createTransaction(new Address(address), {
                    func: new ContractFunction("MultiESDTNFTTransfer"),
                    gasLimit: 20_000_000,
                    args: [
                        new AddressValue(new Address(farm.farm_address)),
                        new BigUIntValue(new BigNumber(tokens.length)),

                        ...farmTokenArgs,
                        new TokenIdentifierValue("exitFarm"),
                    ],
                });
            },
        [createTransaction]
    );

    const exitFarm = useRecoilCallback(
        ({ snapshot, set }) =>
            async (
                lpAmt: BigNumber,
                farm: IFarm,
                unstakeMax: boolean = false
            ) => {
                const loggedIn = await snapshot.getPromise(accIsLoggedInState);
                const farmRecords = await snapshot.getPromise(farmRecordsState);

                if (!loggedIn) return { sessionId: "" };
                try {
                    const farmRecord = farmRecords.find(
                        (val) => val.farm.farm_address === farm.farm_address
                    );
                    if (!farmRecord || !farmRecord.stakedData)
                        return { sessionId: "" };
                    const { stakedData } = farmRecord;
                    const farmTokens = stakedData.farmTokens || [];
                    const entries = unstakeMax
                        ? farmTokens.map((t) => ({
                              unstakeAmt: t.balance,
                              farmToken: t,
                          }))
                        : calcUnstakeEntries(lpAmt, farmTokens);
                    const payload: DappSendTransactionsPropsType = {
                        transactions: await createExitFarmTxMulti(
                            entries.map(
                                ({
                                    farmToken: { collection, nonce, tokenId },
                                    unstakeAmt,
                                }) => ({
                                    amount: unstakeAmt,
                                    collection,
                                    nonce: nonce.toNumber(),
                                    tokenId,
                                })
                            ),
                            farm
                        ),
                        transactionsDisplayInfo: {
                            successMessage: `Unstake succeed ${toEGLDD(
                                farm.farming_token_decimal,
                                lpAmt
                            )} ${farm.farming_token_id}`,
                        },
                    };
                    const result = await sendTransactions(payload);
                    if (result.sessionId)
                        set(farmSessionIdMapState, (val) => ({
                            ...val,
                            [farm.farm_address]: [
                                ...(val[farm.farm_address] || []),
                                result.sessionId!,
                            ],
                        }));
                    return result;
                } catch (error) {
                    console.error(error);
                }
                return { sessionId: "" };
            },
        [createExitFarmTxMulti]
    );

    const estimateRewardOnExit = useRecoilCallback(
        ({ snapshot, set }) =>
            async (lpAmt: BigNumber, farm: IFarm) => {
                const farmRecords = await snapshot.getPromise(farmRecordsState);
                const farmRecord = farmRecords.find(
                    (val) => val.farm.farm_address === farm.farm_address
                );
                if (!farmRecord?.stakedData?.farmTokens.length)
                    return new BigNumber(0);
                const entries = calcUnstakeEntries(
                    lpAmt,
                    farmRecord.stakedData.farmTokens
                );
                const rewards = entries.map(({ unstakeAmt, farmToken }) =>
                    getReward(farm, unstakeAmt, farmToken.tokenId)
                );
                const totalRewards = await Promise.all(rewards);
                return totalRewards.reduce(
                    (total, val) => total.plus(val),
                    new BigNumber(0)
                );
            },
        [getReward]
    );
    return { createExitFarmTx, exitFarm, estimateRewardOnExit };
};

export default useExitFarm;
