import { Address, ContractFunction } from "@elrondnetwork/erdjs/out";
import { accIsLoggedInState } from "atoms/dappState";
import { govLockedAmtState, govUnlockTSState } from "atoms/govState";
import { ASHSWAP_CONFIG } from "const/ashswapConfig";
import { ASH_TOKEN } from "const/tokens";
import { toEGLDD } from "helper/balance";
import {
    sendTransactions,
    useCreateTransaction,
} from "helper/transactionMethods";
import { DappSendTransactionsPropsType } from "interface/dappCore";
import moment from "moment";
import { useRecoilCallback } from "recoil";

const useGovUnlockASH = () => {
    const createTransaction = useCreateTransaction();
    const unlockASH = useRecoilCallback(
        ({ snapshot, set }) =>
            async () => {
                const loggedIn = await snapshot.getPromise(accIsLoggedInState);
                const unlockTS = await snapshot.getPromise(govUnlockTSState);
                const lockedAmt = await snapshot.getPromise(govLockedAmtState);

                if (!loggedIn || unlockTS.minus(moment().unix()).gt(0))
                    return { sessionId: "" };
                try {
                    const payload: DappSendTransactionsPropsType = {
                        transactions: await createTransaction(
                            new Address(
                                ASHSWAP_CONFIG.dappContract.voteEscrowedContract
                            ),
                            {
                                func: new ContractFunction("withdraw"),
                                gasLimit: 7_000_000,
                            }
                        ),
                        transactionsDisplayInfo: {
                            successMessage: `Unlock success ${toEGLDD(
                                ASH_TOKEN.decimals,
                                lockedAmt
                            )} ${ASH_TOKEN.symbol}`,
                        },
                    };
                    return await sendTransactions(payload);
                } catch (error) {
                    console.error(error);
                    return { sessionId: "" };
                }
            },
        [createTransaction]
    );

    return unlockASH;
};

export default useGovUnlockASH;
