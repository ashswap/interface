import {
    Address,
    AddressValue,
    BigUIntValue,
    BooleanValue,
    ContractFunction,
    TokenIdentifierValue,
    Transaction,
    TypedValue,
} from "@elrondnetwork/erdjs/out";
import { accAddressState, accIsLoggedInState } from "atoms/dappState";
import {
    farmRecordsState,
    farmSessionIdMapState,
    FarmToken,
} from "atoms/farmsState";
import BigNumber from "bignumber.js";
import { ASH_TOKEN } from "const/tokens";

import { toEGLDD } from "helper/balance";
import {
    sendTransactions,
    useCreateTransaction,
} from "helper/transactionMethods";
import { DappSendTransactionsPropsType } from "interface/dappCore";
import { IFarm } from "interface/farm";
import { useRecoilCallback } from "recoil";

const useFarmClaimReward = () => {
    const createTransaction = useCreateTransaction();
    const createClaimRewardTxMulti = useRecoilCallback(
        ({ snapshot, set }) =>
            async (
                tokens: FarmToken[],
                farm: IFarm,
                selfBoost: boolean = false
            ) => {
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
                            new BigUIntValue(val.balance),
                        ];
                        return total;
                    },
                    []
                );
                return await createTransaction(new Address(address), {
                    func: new ContractFunction("MultiESDTNFTTransfer"),
                    gasLimit: 15_000_000 + tokens.length * 2_000_000,
                    args: [
                        new AddressValue(new Address(farm.farm_address)),
                        new BigUIntValue(new BigNumber(tokens.length)),

                        ...farmTokenArgs,
                        new TokenIdentifierValue("claimRewards"),
                        new BooleanValue(selfBoost),
                    ],
                });
            },
        [createTransaction]
    );

    const claimReward = useRecoilCallback(
        ({ snapshot, set }) =>
            async (farm: IFarm) => {
                const farmRecords = await snapshot.getPromise(farmRecordsState);

                const farmRecord = farmRecords.find(
                    (val) => val.farm.farm_address === farm.farm_address
                );
                if (!farmRecord || !farmRecord.stakedData)
                    throw new Error("unable to claim reward");

                try {
                    const { stakedData } = farmRecord;
                    const tx = await createClaimRewardTxMulti(
                        farmRecord.stakedData.farmTokens,
                        farm,
                        false
                    );
                    const payload: DappSendTransactionsPropsType = {
                        transactions: tx,
                        transactionsDisplayInfo: {
                            successMessage: `Claim succeed ${toEGLDD(
                                ASH_TOKEN.decimals,
                                stakedData.totalRewardAmt
                            )} ${ASH_TOKEN.symbol}`,
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
                } catch (error) {
                    console.error(error);
                }
            },
        [createClaimRewardTxMulti]
    );

    const claimAllFarmsReward = useRecoilCallback(
        ({ snapshot, set }) =>
            async () => {
                const farmRecords = await snapshot.getPromise(farmRecordsState);

                let txs: Transaction[] = [];
                let totalASH = new BigNumber(0);
                const farmsAddress: string[] = [];
                for (let i = 0; i < farmRecords.length; i++) {
                    const val = farmRecords[i];
                    if (val?.stakedData?.totalRewardAmt.gt(0)) {
                        const temp = await createClaimRewardTxMulti(
                            val.stakedData.farmTokens,
                            val.farm,
                            false
                        );
                        txs = [...txs, temp];
                        totalASH = totalASH.plus(val.stakedData.totalRewardAmt);
                        farmsAddress.push(val.farm.farm_address);
                    }
                }
                const payload: DappSendTransactionsPropsType = {
                    transactions: txs,
                    transactionsDisplayInfo: {
                        successMessage: `Claim succeed ${toEGLDD(
                            ASH_TOKEN.decimals,
                            totalASH
                        )} ${ASH_TOKEN.symbol}`,
                    },
                };
                const result = await sendTransactions(payload);
                if (result.sessionId)
                    set(farmSessionIdMapState, (val) => ({
                        ...val,
                        ...Object.fromEntries(
                            farmsAddress.map((farm_address) => [
                                farm_address,
                                [
                                    ...(val[farm_address] || []),
                                    result.sessionId!,
                                ],
                            ])
                        ),
                    }));
            }
    );

    return {
        claimReward,
        claimAllFarmsReward,
        createClaimRewardTxMulti,
    };
};

export default useFarmClaimReward;
