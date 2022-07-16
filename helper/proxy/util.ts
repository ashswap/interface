import { AccountInfoSliceNetworkType } from "@elrondnetwork/dapp-core/types";
import { getNetworkConfig } from "@elrondnetwork/dapp-core/utils";
import {
    ApiNetworkProvider,
    ProxyNetworkProvider,
} from "@elrondnetwork/erdjs-network-providers/out";
import ElrondProxyProvider from "./elrondProxyProvider";

let proxyProvider: ProxyNetworkProvider | null = null;
export const getProxyNetworkProvider = () => {
    const network: AccountInfoSliceNetworkType = getNetworkConfig();
    if (!proxyProvider) {
        proxyProvider = new ProxyNetworkProvider(network.apiAddress, {
            timeout: +network.apiTimeout,
        });
    }
    return proxyProvider;
};
let apiProvider: ApiNetworkProvider | null = null;
export const getApiNetworkProvider = () => {
    const network: AccountInfoSliceNetworkType = getNetworkConfig();
    if (!apiProvider) {
        apiProvider = new ApiNetworkProvider(network.apiAddress, {
            timeout: +network.apiTimeout,
        });
    }
    return apiProvider;
};

let elrondProxyProvider: ElrondProxyProvider | null = null;
export const getElrondProxyProvider = () => {
    const network: AccountInfoSliceNetworkType = getNetworkConfig();
    if (!elrondProxyProvider) {
        elrondProxyProvider = new ElrondProxyProvider(network.apiAddress);
    }
    return elrondProxyProvider;
};
