import {
    Address,
    BigUIntValue,
    ContractFunction,
    TokenIdentifierValue,
    Transaction,
    U64Value,
} from "@elrondnetwork/erdjs/out";
import { accIsLoggedInState } from "atoms/dappState";
import { govUnlockTSState } from "atoms/govState";
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

const useGovLockMore = () => {
    const createTransaction = useCreateTransaction();
    const lockMoreASH = useRecoilCallback(
        ({ snapshot, set }) =>
            async ({
                weiAmt,
                unlockTimestamp,
            }: { weiAmt?: BigNumber; unlockTimestamp?: BigNumber } = {}) => {
                const loggedIn = await snapshot.getPromise(accIsLoggedInState);
                const unlockTS = await snapshot.getPromise(govUnlockTSState);

                if (!loggedIn) return { sessionId: "" };
                let txs: Transaction[] = [];
                if (weiAmt && weiAmt.gt(0)) {
                    const increaseAmtTx = await createTransaction(
                        new Address(
                            ASHSWAP_CONFIG.dappContract.voteEscrowedContract
                        ),
                        {
                            func: new ContractFunction("ESDTTransfer"),
                            gasLimit: 7_000_000,
                            args: [
                                new TokenIdentifierValue(ASH_TOKEN.id),
                                new BigUIntValue(weiAmt),
                                new TokenIdentifierValue("increase_amount"),
                            ],
                        }
                    );
                    txs.push(increaseAmtTx);
                }
                if (unlockTimestamp && unlockTimestamp.gt(unlockTS)) {
                    const increaseLockTSTx = await createTransaction(
                        new Address(
                            ASHSWAP_CONFIG.dappContract.voteEscrowedContract
                        ),
                        {
                            func: new ContractFunction("increase_unlock_time"),
                            gasLimit: 7_000_000,
                            args: [new U64Value(unlockTimestamp)],
                        }
                    );
                    txs.push(increaseLockTSTx);
                }
                if (!txs.length) return { sessionId: "" };

                const payload: DappSendTransactionsPropsType = {
                    transactions: txs,
                    transactionsDisplayInfo: {
                        successMessage: `Lock succeed ${toEGLD(
                            ASH_TOKEN,
                            weiAmt?.toString() || "0"
                        )} ${ASH_TOKEN.symbol}, unlock on ${moment
                            .unix(
                                unlockTimestamp?.toNumber() ||
                                    unlockTS?.toNumber()
                            )
                            .format("DD MMM, yyyy")}`,
                    },
                };
                return await sendTransactions(payload);
            },
        [createTransaction]
    );

    return lockMoreASH;
};

export default useGovLockMore;
