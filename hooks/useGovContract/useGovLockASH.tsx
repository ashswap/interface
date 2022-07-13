import {
    Address,
    BigUIntValue,
    ContractFunction,
    TokenIdentifierValue,
    U64Value,
} from "@elrondnetwork/erdjs/out";
import BigNumber from "bignumber.js";
import { ASHSWAP_CONFIG } from "const/ashswapConfig";
import { ASH_TOKEN } from "const/tokens";
import { toEGLD } from "helper/balance";
import {
    sendTransactions,
    useCreateTransaction,
} from "helper/transactionMethods";
import { DappSendTransactionsPropsType } from "interface/dappCore";
import moment from "moment";
import { useRecoilCallback } from "recoil";

const useGovLockASH = () => {
    const createTransaction = useCreateTransaction();
    const lockASH = useRecoilCallback(
        ({ snapshot, set }) =>
            async (weiAmt: BigNumber, unlockTimestamp: BigNumber) => {
                try {
                    const payload: DappSendTransactionsPropsType = {
                        transactions: await createTransaction(
                            new Address(
                                ASHSWAP_CONFIG.dappContract.voteEscrowedContract
                            ),
                            {
                                func: new ContractFunction("ESDTTransfer"),
                                gasLimit: 7_000_000,
                                args: [
                                    new TokenIdentifierValue(ASH_TOKEN.id),
                                    new BigUIntValue(weiAmt),
                                    new TokenIdentifierValue("create_lock"),
                                    new U64Value(unlockTimestamp),
                                ],
                            }
                        ),
                        transactionsDisplayInfo: {
                            successMessage: `Lock succeed ${toEGLD(
                                ASH_TOKEN,
                                weiAmt?.toString() || "0"
                            )} ${ASH_TOKEN.symbol}, unlock on ${moment
                                .unix(unlockTimestamp.toNumber())
                                .format("DD MMM, yyyy")}`,
                        },
                    };
                    return sendTransactions(payload);
                } catch (error) {
                    console.error(error);
                    return { sessionId: "" };
                }
            },
        [createTransaction]
    );
    return lockASH;
};
export default useGovLockASH;
