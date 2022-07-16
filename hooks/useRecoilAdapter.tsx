import { useSelector } from "@elrondnetwork/dapp-core/reduxStore/DappProviderContext";
import { dappCoreState } from "atoms/dappState";
import { walletLPMapState, walletTokenPriceState } from "atoms/walletState";
import { ASHSWAP_CONFIG } from "const/ashswapConfig";
import { blockTimeMs } from "const/dappConfig";
import pools from "const/pool";
import { TOKENS } from "const/tokens";
import { toWei } from "helper/balance";
import { arrayFetcher } from "helper/common";
import { getApiNetworkProvider } from "helper/proxy/util";
import { useFetchBalances } from "hooks/useFetchBalances";
import { ITokenMap } from "interface/token";
import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import useSWR from "swr";
import useInterval from "./useInterval";

export function useRecoilAdapter() {
    // copy whole dappContext to recoil
    const store = useSelector((state) => state);
    const apiProvider = getApiNetworkProvider();
    // end

    // recoil
    const setDappState = useSetRecoilState(dappCoreState);
    const setTokenPrices = useSetRecoilState(walletTokenPriceState);
    const setLpTokens = useSetRecoilState(walletLPMapState);
    // end recoil

    const fetchBalances = useFetchBalances();

    // connect recoil state to dapp-core

    useEffect(() => {
        setDappState(store as any);
    }, [setDappState, store]);

    const { data: priceEntries } = useSWR<number[]>(
        TOKENS.map((token) =>
            token.id
                ? `${ASHSWAP_CONFIG.ashApiBaseUrl}/token/${token.id}/price`
                : null
        ),
        arrayFetcher,
        { refreshInterval: 60000 }
    );

    useEffect(() => {
        const map = Object.fromEntries(
            TOKENS.map((t, i) => [t.id, priceEntries?.[i] || 0])
        );
        setTokenPrices(map);
    }, [setTokenPrices, priceEntries]);

    useEffect(() => {
        let tokens: ITokenMap = {};
        pools.map((p) => {
            if (!Object.prototype.hasOwnProperty.call(tokens, p.lpToken.id)) {
                tokens[p.lpToken.id] = { ...p.lpToken };
            }
        });

        let promiseLpSupply: Promise<string>[] = [];
        let tokenIds: any[] = [];
        for (const tokenId in tokens) {
            if (Object.prototype.hasOwnProperty.call(tokens, tokenId)) {
                tokenIds.push(tokenId);
                promiseLpSupply.push(
                    apiProvider
                        .getDefinitionOfFungibleToken(tokenId)
                        .then((val) => val.supply.toString())
                        .catch(() => "0")
                );
            }
        }

        Promise.all(promiseLpSupply).then((results) => {
            results.map((supply, i) => {
                tokens[tokenIds[i]] = {
                    ...tokens[tokenIds[i]],
                    totalSupply: toWei(tokens[tokenIds[i]], supply || "0"),
                };
            });
            setLpTokens(tokens);
        });
    }, [apiProvider, setLpTokens]);

    // fetch token balance every block
    useInterval(fetchBalances, blockTimeMs);
}
