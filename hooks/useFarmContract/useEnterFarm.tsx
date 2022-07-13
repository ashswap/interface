import {
    Address,
    AddressValue,
    BigUIntValue,
    BooleanValue,
    ContractFunction,
    TokenIdentifierValue,
    TypedValue,
} from "@elrondnetwork/erdjs/out";
import { accAddressState, accIsLoggedInState } from "atoms/dappState";
import { farmRecordsState, farmSessionIdMapState } from "atoms/farmsState";
import BigNumber from "bignumber.js";
import { toEGLDD } from "helper/balance";
import {
    sendTransactions,
    useCreateTransaction,
} from "helper/transactionMethods";
import { DappSendTransactionsPropsType } from "interface/dappCore";
import { IFarm } from "interface/farm";
import { useRecoilCallback } from "recoil";

const useEnterFarm = () => {
    const createTransaction = useCreateTransaction();
    const func = useRecoilCallback(
        ({ snapshot, set }) =>
            async (
                amtWei: BigNumber,
                farm: IFarm,
                selfBoost: boolean = false
            ) => {
                const loggedIn = await snapshot.getPromise(accIsLoggedInState);
                const address = await snapshot.getPromise(accAddressState);
                const farmRecords = await snapshot.getPromise(farmRecordsState);

                if (!amtWei || amtWei.eq(0) || !loggedIn || !address)
                    return { sessionId: "" };
                try {
                    const farmTokenInWallet =
                        farmRecords
                            .find(
                                (f) => f.farm.farm_address === farm.farm_address
                            )
                            ?.stakedData?.farmTokens.filter(
                                (f) => f.attributes.booster === address
                            ) || [];
                    // console.log('in', farmTokenInWallet);
                    const farmTokenArgs = farmTokenInWallet.reduce(
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
                    const tx = await createTransaction(new Address(address), {
                        func: new ContractFunction("MultiESDTNFTTransfer"),
                        gasLimit:
                            15_000_000 + farmTokenInWallet.length * 2_000_000,
                        args: [
                            new AddressValue(new Address(farm.farm_address)),
                            new BigUIntValue(
                                new BigNumber(1 + farmTokenInWallet.length)
                            ),

                            new TokenIdentifierValue(farm.farming_token_id),
                            new BigUIntValue(new BigNumber(0)),
                            new BigUIntValue(amtWei),

                            ...farmTokenArgs,

                            new TokenIdentifierValue("enterFarm"),
                            new BooleanValue(selfBoost),
                        ],
                    });
                    const payload: DappSendTransactionsPropsType = {
                        transactions: tx,
                        transactionsDisplayInfo: {
                            successMessage: `Stake succeed ${toEGLDD(
                                farm.farming_token_decimal,
                                amtWei
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
                    console.log(error);
                }
                return { sessionId: "" };
            },
        [createTransaction]
    );
    return func;
};

export default useEnterFarm;
