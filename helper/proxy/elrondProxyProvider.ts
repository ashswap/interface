import {
    ApiNetworkProvider,
    NonFungibleTokenOfAccountOnNetwork,
    ProxyNetworkProvider,
} from "@elrondnetwork/erdjs-network-providers/out";
import BigNumber from "bignumber.js";
import {
    isMetaESDTResponse,
    NFTOfAccountResponse,
} from "interface/proxyResponse/nftOfAccount";
import { IMetaESDT } from "interface/tokens";
import { NFTType } from "interface/tokens/type";

const buildUrlParams = (
    query: Record<string, number | string | string[] | number[] | boolean>
) => {
    const params = Object.entries(query)
        .map(([k, v]) => {
            if (Array.isArray(v)) {
                return `${k}=${v.map((_) => _.toString()).join(",")}`;
            } else {
                return `${k}=${v}`;
            }
        })
        .join("&");
    return `?${params}`;
};
export default class ElrondProxyProvider {
    apiProvider: ApiNetworkProvider;
    proxyProvider: ProxyNetworkProvider;
    constructor(apiAddress: string) {
        this.apiProvider = new ApiNetworkProvider(apiAddress);
        this.proxyProvider = new ProxyNetworkProvider(apiAddress);
    }

    async getNFTsOfAccount<T extends NFTType>(
        address: string,
        query: {
            from?: number;
            size?: number;
            search?: string;
            identifiers?: string[] | string;
            type?: T;
            collections: string[] | string;
            creator?: string;
            withSupply?: boolean;
        }
    ): Promise<
        T extends "MetaESDT"
            ? IMetaESDT[]
            : Array<IMetaESDT | NFTOfAccountResponse>
    > {
        const res: NFTOfAccountResponse[] = await this.apiProvider.doGetGeneric(
            `accounts/${address}/nfts${buildUrlParams(query)}`
        );
        const list = res.map((r) => {
            if (isMetaESDTResponse(r)) {
                const { supply, ...props } = r;
                const metaEsdt: IMetaESDT = {
                    ...props,
                    balance: new BigNumber(r.balance),
                };
                if (supply) {
                    metaEsdt.supply = new BigNumber(supply);
                }
                return metaEsdt;
            } else {
                return r;
            }
        });
        return list as any;
    }
}
