import {
    Address,
    AddressValue,
    ContractFunction,
} from "@elrondnetwork/erdjs/out";
import { accAddressState, accIsLoggedInState } from "atoms/dappState";
import { ASHSWAP_CONFIG } from "const/ashswapConfig";
import {
    sendTransactions,
    useCreateTransaction,
} from "helper/transactionMethods";
import { DappSendTransactionsPropsType } from "interface/dappCore";
import { useRecoilCallback } from "recoil";

const useGovClaimReward = () => {
    const createTransaction = useCreateTransaction();
    const claimReward = useRecoilCallback(
        ({ snapshot, set }) =>
            async () => {
                const loggedIn = await snapshot.getPromise(accIsLoggedInState);
                const address = await snapshot.getPromise(accAddressState);

                if (!loggedIn) return { sessionId: "" };
                try {
                    const tx1 = await createTransaction(
                        new Address(ASHSWAP_CONFIG.dappContract.feeDistributor),
                        {
                            func: new ContractFunction(
                                "checkpoint_total_supply"
                            ),
                            gasLimit: 7_000_000,
                        }
                    );
                    const tx2 = await createTransaction(
                        new Address(ASHSWAP_CONFIG.dappContract.feeDistributor),
                        {
                            func: new ContractFunction("claim"),
                            gasLimit: 500_000_000,
                            args: [new AddressValue(new Address(address))],
                        }
                    );
                    const payload: DappSendTransactionsPropsType = {
                        transactions: [tx1, tx2],
                        transactionsDisplayInfo: {
                            successMessage: `Reward was sent to your wallet`,
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

    return claimReward;
};

export default useGovClaimReward;
