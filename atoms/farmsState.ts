import { SendTransactionReturnType } from "@elrondnetwork/dapp-core/types";
import BigNumber from "bignumber.js";
import { FARMS } from "const/farms";
import pools from "const/pool";
import { FarmTokenAttrs, IFarm } from "interface/farm";
import IPool from "interface/pool";
import { PoolStatsRecord } from "interface/poolStats";
import { Dispatch, SetStateAction } from "react";
import { atom, selector, selectorFamily } from "recoil";
import { ViewType } from "views/stake/farms/FarmFilter";
import { accAddressState } from "./dappState";
export type FarmToken = {
    tokenId: string;
    collection: string;
    nonce: BigNumber;
    balance: BigNumber;
    attributes: FarmTokenAttrs;
    boost: BigNumber;
    perLP: BigNumber;
    lpAmt: BigNumber;
    farmAddress: string;
};
export type FarmRecord = {
    pool: IPool;
    farm: IFarm;
    poolStats?: PoolStatsRecord;
    stakedData?: {
        farmTokens: FarmToken[];
        totalStakedLP: BigNumber;
        totalRewardAmt: BigNumber;
        totalStakedLPValue: BigNumber;
        boost: BigNumber;
    };
    ashPerBlock: BigNumber;
    farmTokenSupply: BigNumber;
    lpLockedAmt: BigNumber;
    totalLiquidityValue: BigNumber;
    emissionAPR: BigNumber;
};
export type FarmsState = {
    farmRecords: FarmRecord[];
    farmToDisplay: FarmRecord[];
    sortOption: "apr" | "liquidity" | "volume";
    keyword: string;
    stakedOnly: boolean;
    inactive: boolean;
    loadingMap: Record<string, boolean>;
    setSortOption: Dispatch<SetStateAction<"apr" | "liquidity" | "volume">>;
    setKeyword: Dispatch<SetStateAction<string>>;
    setStakedOnly: Dispatch<SetStateAction<boolean>>;
    setInactive: Dispatch<SetStateAction<boolean>>;
    enterFarm: (
        amtWei: BigNumber,
        farm: IFarm
    ) => Promise<SendTransactionReturnType>;
    claimReward: (farm: IFarm) => Promise<void>;
    claimAllReward: () => Promise<void>;
    exitFarm: (
        lpAmt: BigNumber,
        farm: IFarm
    ) => Promise<SendTransactionReturnType>;
    estimateRewardOnExit: (lpAmt: BigNumber, farm: IFarm) => Promise<BigNumber>;
};

export const farmRecordsState = atom<FarmRecord[]>({
    key: "farm_records",
    default: [],
});

export const farmSortOptionState = atom<FarmsState["sortOption"]>({
    key: "farm_sort_option",
    default: "apr",
});

export const farmKeywordState = atom<string>({
    key: "farm_keyword",
    default: "",
});

export const farmDeboundKeywordState = atom<string>({
    key: "farm_debound_keyword",
    default: "",
});

export const farmStakedOnlyState = atom<boolean>({
    key: "farm_staked_only",
    default: false,
});

export const farmViewTypeState = atom<ViewType>({
    key: "farm_view_type",
    default: ViewType.Card,
});

export const farmBlockRewardMapState = atom<Record<string, BigNumber>>({
    key: "farm_block_reward_map",
    default: {},
});

export const farmLoadingMapState = atom<FarmsState["loadingMap"]>({
    key: "farm_loading_map",
    default: {},
});

export const farmSessionIdMapState = atom<Record<string, string[]>>({
    key: "farm_session_id_map",
    default: {},
});

export const farmToDisplayState = selector<FarmRecord[]>({
    key: "farm_to_display",
    get: ({ get }) => {
        const farmRecords = get(farmRecordsState);
        const stakedOnly = get(farmStakedOnlyState);
        const deboundKeyword = get(farmDeboundKeywordState);
        const sortOption = get(farmSortOptionState);

        let result: FarmRecord[] = [...farmRecords].filter((p) =>
            stakedOnly ? !!p.stakedData : true
        );

        if (deboundKeyword.trim()) {
            result = farmRecords.filter((p) =>
                p.pool.tokens.some((t) =>
                    t.symbol
                        .toLowerCase()
                        .includes(deboundKeyword.trim().toLowerCase())
                )
            );
        }
        switch (sortOption) {
            case "apr":
                result = result.sort((x, y) =>
                    y.emissionAPR.minus(x.emissionAPR).toNumber()
                );
                break;
            case "liquidity":
                result = result.sort((x, y) =>
                    y.totalLiquidityValue
                        .minus(x.totalLiquidityValue)
                        .toNumber()
                );
                break;
            case "volume":
                result = result.sort(
                    (x, y) =>
                        (y.poolStats?.usd_volume || 0) -
                        (x.poolStats?.usd_volume || 0)
                );
                break;
            default:
        }
        return result;
    },
    cachePolicy_UNSTABLE: {
        eviction: "most-recent",
    },
});

export const farmTokensState = selector<FarmToken[]>({
    key: "farm_tokens_list",
    get: ({ get }) => {
        const farmRecords = get(farmRecordsState);
        return farmRecords.reduce(
            (total: FarmToken[], record) => [
                ...total,
                ...(record.stakedData?.farmTokens || []),
            ],
            []
        );
    },
    cachePolicy_UNSTABLE: {
        eviction: "most-recent",
    },
});

export const farmOwnerTokensState = selector<FarmToken[]>({
    key: "farm_owner_tokens",
    get: ({ get }) => {
        const tokens = get(farmTokensState);
        const address = get(accAddressState);
        return tokens.filter((t) => t.attributes.booster === address);
    },
    cachePolicy_UNSTABLE: {
        eviction: "most-recent",
    },
});

export const farmTransferedTokensState = selector<FarmToken[]>({
    key: "farm_transfered_tokens",
    get: ({ get }) => {
        const tokens = get(farmTokensState);
        const address = get(accAddressState);
        return tokens.filter((t) => t.attributes.booster !== address);
    },
    cachePolicy_UNSTABLE: {
        eviction: "most-recent",
    },
});

export const farmMapAddressState = selector({
    key: "farm_data_map_address",
    get: ({ get }) => {
        const farmRecords = get(farmRecordsState);
        return Object.fromEntries(
            farmRecords.map((f) => [f.farm.farm_address, f])
        );
    },
    cachePolicy_UNSTABLE: {
        eviction: "most-recent",
    },
});

export const farmQuery = selectorFamily({
    key: "farm_single_selector_by_address",
    get:
        (address: string) =>
        ({ get }) => {
            return get(farmMapAddressState)[address];
        },
});

export const farmOwnerTokensQuery = selectorFamily({
    key: "farm_owner_tokens_query_by_farm_address",
    get:
        (farmAddress: string) =>
        ({ get }) => {
            const farmRecord = get(farmQuery(farmAddress));
            const address = get(accAddressState);
            return (
                farmRecord.stakedData?.farmTokens?.filter(
                    (f) => f.attributes.booster === address
                ) || []
            );
        },
    cachePolicy_UNSTABLE: {
        eviction: "most-recent",
    },
});

export const farmTransferedTokensQuery = selectorFamily({
    key: "farm_transfered_tokens_query_by_farm_address",
    get:
        (farmAddress: string) =>
        ({ get }) => {
            const farmRecord = get(farmQuery(farmAddress));
            const address = get(accAddressState);
            return (
                farmRecord.stakedData?.farmTokens?.filter(
                    (f) => f.attributes.booster !== address
                ) || []
            );
        },
    cachePolicy_UNSTABLE: {
        eviction: "most-recent",
    },
});
