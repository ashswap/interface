import { FungibleTokenOfAccountOnNetwork } from "@elrondnetwork/erdjs-network-providers/out";
import { Address } from "@elrondnetwork/erdjs/out";
import { accAddressState, accIsLoggedInState } from "atoms/dappState";
import { walletBalanceState } from "atoms/walletState";
import { getProxyNetworkProvider } from "helper/proxy/util";
import { useRecoilCallback } from "recoil";

export const useFetchBalances = () => {
    const fetchBalances = useRecoilCallback(
        ({ snapshot, set }) =>
            async () => {
                try {
                    const isLoggedIn = await snapshot.getPromise(
                        accIsLoggedInState
                    );
                    const address = await snapshot.getPromise(accAddressState);
                    if (!isLoggedIn) {
                        set(walletBalanceState, {});
                        return;
                    }
                    const proxy = getProxyNetworkProvider();
                    FungibleTokenOfAccountOnNetwork;
                    proxy
                        .getFungibleTokensOfAccount(new Address(address))
                        .then((resp) => {
                            const entries = resp.map((val) => [
                                val.identifier,
                                val,
                            ]);
                            set(
                                walletBalanceState,
                                Object.fromEntries(entries)
                            );
                        });
                } catch (error) {
                    console.error(error);
                }
            },
        []
    );
    return fetchBalances;
};
