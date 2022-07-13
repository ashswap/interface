import { AccountInfoSliceNetworkType } from "@elrondnetwork/dapp-core/types";
import { getNetworkConfig } from "@elrondnetwork/dapp-core/utils";
import {
    ApiNetworkProvider,
    ProxyNetworkProvider,
} from "@elrondnetwork/erdjs-network-providers/out";
import ElrondProxyProvider from "./elrondProxyProvider";

export const getProxyNetworkProvider = () => {
    const network: AccountInfoSliceNetworkType = getNetworkConfig();
    return new ProxyNetworkProvider(network.apiAddress);
};

export const getApiNetworkProvider = () => {
    const network: AccountInfoSliceNetworkType = getNetworkConfig();
    return new ApiNetworkProvider(network.apiAddress);
};

export const getElrondProxyProvider = () => {
    const network: AccountInfoSliceNetworkType = getNetworkConfig();
    return new ElrondProxyProvider(network.apiAddress);
};
