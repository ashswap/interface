import { useGetPendingTransactions } from "@elrondnetwork/dapp-core/hooks";
import { SendTransactionReturnType } from "@elrondnetwork/dapp-core/types";
import { Address, ContractFunction, Query } from "@elrondnetwork/erdjs/out";
import { accAddressState } from "atoms/dappState";
import {
    farmBlockRewardMapState,
    farmDeboundKeywordState,
    farmKeywordState,
    farmLoadingMapState,
    FarmRecord,
    farmRecordsState,
    farmSessionIdMapState,
    FarmToken,
} from "atoms/farmsState";
import { walletBalanceState, walletTokenPriceState } from "atoms/walletState";
import BigNumber from "bignumber.js";
import { ASHSWAP_CONFIG } from "const/ashswapConfig";
import { blockTimeMs } from "const/dappConfig";
import { FARMS } from "const/farms";
import pools from "const/pool";
import { ASH_TOKEN } from "const/tokens";
import { toEGLDD } from "helper/balance";
import { fetcher } from "helper/common";
import {
    getApiNetworkProvider,
    getElrondProxyProvider,
    getProxyNetworkProvider,
} from "helper/proxy/util";
import {
    decodeNestedStringBase64,
    decodeNestedStringHex,
} from "helper/serializer";
import useFarmReward from "hooks/useFarmContract/useFarmReward";
import useInterval from "hooks/useInterval";
import useLPValue from "hooks/usePoolContract/useLPValue";
import { FarmTokenAttrsStruct, IFarm } from "interface/farm";
import IPool from "interface/pool";
import { PoolStatsRecord } from "interface/poolStats";
import { Dispatch, SetStateAction, useCallback, useEffect } from "react";
import { useRecoilCallback, useRecoilValue, useSetRecoilState } from "recoil";
import useSWR from "swr";
import { useDebounce } from "use-debounce";

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

const FarmsState = () => {
    const keyword = useRecoilValue(farmKeywordState);
    const sessionIdsMap = useRecoilValue(farmSessionIdMapState);
    const setDeboundKeyword = useSetRecoilState(farmDeboundKeywordState);
    const setLoadingMap = useSetRecoilState(farmLoadingMapState);

    const getReward = useFarmReward();

    const [deboundKeyword] = useDebounce(keyword, 500);

    const pendingTransactionsFromStore =
        useGetPendingTransactions().pendingTransactions;
    const getLPValue = useLPValue();

    useEffect(() => {
        setDeboundKeyword(deboundKeyword);
    }, [deboundKeyword, setDeboundKeyword]);
    // fetch pool stats
    const { data: poolStatsRecords } = useSWR<PoolStatsRecord[]>(
        `${ASHSWAP_CONFIG.ashApiBaseUrl}/pool`,
        fetcher
    );

    const getBlockReward = useRecoilCallback(
        () => async (farmAddress: string) => {
            const proxy = getProxyNetworkProvider();
            return await proxy
                .queryContract(
                    new Query({
                        address: new Address(farmAddress),
                        func: new ContractFunction("getPerBlockRewardAmount"),
                    })
                )
                .then(({ returnData }) => {
                    return new BigNumber(
                        Buffer.from(returnData[0], "base64").toString("hex"),
                        16
                    );
                });
        },
        []
    );

    const getFarmBlockRewardMap = useRecoilCallback(
        ({ set }) =>
            async () => {
                try {
                    const rewards = await Promise.all(
                        FARMS.map((f) => getBlockReward(f.farm_address))
                    );
                    const entries: [string, BigNumber][] = rewards.map(
                        (reward, i) => [FARMS[i].farm_address, reward]
                    );
                    const map = Object.fromEntries(entries);
                    set(farmBlockRewardMapState, map);
                } catch (error) {
                    console.error(error);
                }
            },
        [getBlockReward]
    );

    const getFarmTokenSupply = useRecoilCallback(
        () => async (farmAddress: string) => {
            const proxy = getProxyNetworkProvider();
            return proxy
                .queryContract(
                    new Query({
                        address: new Address(farmAddress),
                        func: new ContractFunction("getFarmTokenSupply"),
                    })
                )
                .then(({ returnData }) => {
                    return returnData[0]
                        ? new BigNumber(
                              Buffer.from(returnData[0], "base64").toString(
                                  "hex"
                              ),
                              16
                          )
                        : new BigNumber(0);
                });
        },
        []
    );

    const getTotalLPLocked = useCallback(async (farm: IFarm) => {
        const proxyProvider = getProxyNetworkProvider();
        const res = await proxyProvider.getFungibleTokenOfAccount(
            new Address(farm.farm_address),
            farm.farming_token_id
        );
        return res.balance || new BigNumber(0);
    }, []);

    const getFarmRecord = useRecoilCallback(
        ({ snapshot, set }) =>
            async (f: IFarm, p: IPool) => {
                const balances = await snapshot.getPromise(walletBalanceState);
                const accAddress = await snapshot.getPromise(accAddressState);
                const blockRewardMap = await snapshot.getPromise(
                    farmBlockRewardMapState
                );
                const tokenPrices = await snapshot.getPromise(
                    walletTokenPriceState
                );
                const lpLockedAmt = await getTotalLPLocked(f);
                const farmTokenSupply = await getFarmTokenSupply(
                    f.farm_address
                );
                const { lpValueUsd: totalLiquidityValue } = await getLPValue(
                    lpLockedAmt,
                    p
                );
                const ashPerBlock =
                    blockRewardMap[f.farm_address] || new BigNumber(0);
                const totalASH = toEGLDD(
                    ASH_TOKEN.decimals,
                    ashPerBlock
                        .multipliedBy(365 * 24 * 60 * 60)
                        .div(blockTimeMs / 1000)
                );
                const emissionAPR = totalASH
                    .multipliedBy(tokenPrices[ASH_TOKEN.id] || 0)
                    .multipliedBy(100)
                    .div(totalLiquidityValue);

                const record: FarmRecord = {
                    pool: p,
                    farm: f,
                    poolStats: poolStatsRecords?.find(
                        (stats) => stats.pool_address === p.address
                    ),
                    ashPerBlock,
                    farmTokenSupply,
                    lpLockedAmt,
                    totalLiquidityValue,
                    emissionAPR,
                };
                const collectionTokens =
                    await getElrondProxyProvider().getNFTsOfAccount(
                        accAddress,
                        { collections: f.farm_token_id, type: "MetaESDT" }
                    );
                const collectionTokenMap = Object.fromEntries(
                    collectionTokens.map((t) => [t.identifier, t])
                );
                const farmTokensPromises: Promise<FarmToken>[] = Object.keys(
                    balances
                )
                    .filter((tokenId) => tokenId.startsWith(f.farm_token_id))
                    .map(async (id) => {
                        const token = collectionTokenMap[id];
                        const attributes = decodeNestedStringBase64(
                            token.attributes || "",
                            FarmTokenAttrsStruct
                        );
                        const perLP = attributes.initial_farm_amount.div(
                            attributes.initial_farming_amount
                        );
                        const balance = token.balance || new BigNumber(0);
                        return {
                            tokenId: id,
                            collection: f.farm_token_id,
                            nonce: new BigNumber(token.nonce),
                            balance,
                            attributes,
                            boost: perLP.div(0.4),
                            perLP,
                            lpAmt: balance
                                .div(perLP)
                                .integerValue(BigNumber.ROUND_FLOOR),
                            farmAddress: f.farm_address,
                        };
                    });

                const farmTokens = await Promise.all(farmTokensPromises);
                const isFarmed = farmTokens.some(({ balance }) =>
                    balance.gt(0)
                );
                if (isFarmed) {
                    const rewards = farmTokens.map((t) =>
                        getReward(f, t.balance, t.tokenId)
                    );
                    const totalRewards = await Promise.all(rewards);
                    const totalStakedLP = farmTokens.reduce(
                        (total, val) =>
                            total.plus(
                                val.balance
                                    .div(val.perLP)
                                    .integerValue(BigNumber.ROUND_FLOOR)
                            ),
                        new BigNumber(0)
                    );
                    record.stakedData = {
                        farmTokens,
                        totalStakedLP,
                        totalRewardAmt: totalRewards.reduce(
                            (total, val) => total.plus(val),
                            new BigNumber(0)
                        ),
                        totalStakedLPValue: totalStakedLP
                            .multipliedBy(totalLiquidityValue)
                            .div(lpLockedAmt),
                        boost: farmTokens
                            .reduce(
                                (total, f) => total.plus(f.balance),
                                new BigNumber(0)
                            )
                            .div(totalStakedLP)
                            .div(0.4),
                    };
                }
                return record;
            },
        [
            getLPValue,
            poolStatsRecords,
            getReward,
            getFarmTokenSupply,
            getTotalLPLocked,
        ]
    );

    const getFarmRecords = useRecoilCallback(
        ({ snapshot, set }) =>
            async () => {
                try {
                    const recordPromises: Promise<FarmRecord>[] = [];
                    for (let i = 0; i < FARMS.length; i++) {
                        const f = FARMS[i];
                        const p = pools.find(
                            (val) => val.lpToken.id === f.farming_token_id
                        );
                        if (p) {
                            recordPromises.push(getFarmRecord(f, p));
                        }
                    }
                    const records = await Promise.all(recordPromises);
                    set(farmRecordsState, records);
                } catch (error) {
                    console.error(error);
                }
            },
        [getFarmRecord]
    );

    useEffect(() => {
        getFarmBlockRewardMap();
    }, [getFarmBlockRewardMap]);

    useInterval(getFarmRecords, blockTimeMs);

    useEffect(() => {
        if (Object.keys(sessionIdsMap).length > 0) {
            if (Object.keys(pendingTransactionsFromStore).length > 0) {
                const entries = Object.entries(sessionIdsMap).map(
                    ([farm_address, sessionIds]) => {
                        return [
                            farm_address,
                            sessionIds.some(
                                (id) => id in pendingTransactionsFromStore
                            ),
                        ];
                    }
                );
                setLoadingMap(Object.fromEntries(entries));
            } else {
                setLoadingMap({});
            }
        }
    }, [sessionIdsMap, pendingTransactionsFromStore, setLoadingMap]);

    return null;
};

export default FarmsState;
