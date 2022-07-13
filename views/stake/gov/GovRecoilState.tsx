import {
    Address,
    AddressValue,
    BigUIntValue,
    ContractFunction,
    Query,
} from "@elrondnetwork/erdjs";
import { accAddressState, accIsLoggedInState } from "atoms/dappState";
import {
    govLockedAmtState,
    govRewardLPAmtState,
    govRewardLPTokenState,
    govRewardLPValueState,
    govTotalLockedAmtState,
    govTotalLockedPctState,
    govTotalSupplyVeASH,
    govUnlockTSState,
    govVeASHAmtState,
} from "atoms/govState";
import BigNumber from "bignumber.js";
import { ASHSWAP_CONFIG } from "const/ashswapConfig";
import { blockTimeMs } from "const/dappConfig";
import pools from "const/pool";
import { ASH_TOKEN } from "const/tokens";
import { toWei } from "helper/balance";
import {
    getApiNetworkProvider,
    getProxyNetworkProvider,
} from "helper/proxy/util";
import { queryContractParser } from "helper/serializer";
import useInterval from "hooks/useInterval";
import useLPValue from "hooks/usePoolContract/useLPValue";
import moment from "moment";
import { useCallback, useEffect } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";

const GovState = () => {
    const loggedIn = useRecoilValue(accIsLoggedInState);
    const address = useRecoilValue(accAddressState);
    const setVEASH = useSetRecoilState(govVeASHAmtState);
    const setTotalSupplyVeASH = useSetRecoilState(govTotalSupplyVeASH);
    const setRewardValue = useSetRecoilState(govRewardLPValueState);
    const setTotalLockedPct = useSetRecoilState(govTotalLockedPctState);
    const setUnlockTS = useSetRecoilState(govUnlockTSState);
    const [lockedAmt, setLockedAmt] = useRecoilState(govLockedAmtState);
    const [totalLockedAmt, setTotalLockedAmt] = useRecoilState(
        govTotalLockedAmtState
    );
    const [rewardLPAmt, setRewardLPAmt] = useRecoilState(govRewardLPAmtState);
    const [rewardLPToken, setRewardLPToken] = useRecoilState(
        govRewardLPTokenState
    );

    const getLPValue = useLPValue();

    const proxy = getProxyNetworkProvider();
    const apiProvider = getApiNetworkProvider();

    useEffect(() => {
        if (!loggedIn) {
            setLockedAmt(new BigNumber(0));
            setVEASH(new BigNumber(0));
            setUnlockTS(new BigNumber(0));
            setRewardLPAmt(new BigNumber(0));
            setRewardValue(new BigNumber(0));
        }
    }, [
        loggedIn,
        setLockedAmt,
        setVEASH,
        setUnlockTS,
        setRewardLPAmt,
        setRewardValue,
    ]);

    const getVEASHAmt = useCallback(() => {
        if (!loggedIn || !lockedAmt || lockedAmt.eq(0)) return;
        const ts = moment().unix();
        proxy
            .queryContract(
                new Query({
                    address: new Address(
                        ASHSWAP_CONFIG.dappContract.voteEscrowedContract
                    ),
                    func: new ContractFunction("balanceOfAtTs"),
                    args: [
                        new AddressValue(new Address(address)),
                        new BigUIntValue(new BigNumber(ts)),
                    ],
                })
            )
            .then(({ returnData }) => {
                const values = queryContractParser(returnData[0], "BigUint");
                setVEASH(values[0]?.valueOf() || new BigNumber(0));
            });
    }, [loggedIn, address, lockedAmt, proxy, setVEASH]);

    const getLockedAmt = useCallback(() => {
        if (!loggedIn) return;
        proxy
            .queryContract(
                new Query({
                    address: new Address(
                        ASHSWAP_CONFIG.dappContract.voteEscrowedContract
                    ),
                    func: new ContractFunction("getLocked"),
                    args: [new AddressValue(new Address(address))],
                })
            )
            .then(({ returnData }) => {
                const values = queryContractParser(
                    returnData[0],
                    "tuple2<BigUint,U64>"
                );
                setLockedAmt(values[0]?.valueOf().field0 || new BigNumber(0));
                setUnlockTS(values[0]?.valueOf().field1 || new BigNumber(0));
            });
    }, [loggedIn, proxy, address, setLockedAmt, setUnlockTS]);

    const getTotalSupplyVeASH = useCallback(() => {
        const ts = moment().unix();
        proxy
            .queryContract(
                new Query({
                    address: new Address(
                        ASHSWAP_CONFIG.dappContract.voteEscrowedContract
                    ),
                    func: new ContractFunction("totalSupplyAtTs"),
                    args: [new BigUIntValue(new BigNumber(ts))],
                })
            )
            .then(({ returnData }) => {
                const values = queryContractParser(returnData[0], "BigUint");
                setTotalSupplyVeASH(values[0]?.valueOf() || new BigNumber(0));
            });
    }, [proxy, setTotalSupplyVeASH]);

    const getRewardAmt = useCallback(() => {
        if (!loggedIn) return;
        proxy
            .queryContract(
                new Query({
                    address: new Address(
                        ASHSWAP_CONFIG.dappContract.feeDistributor
                    ),
                    func: new ContractFunction("getClaimableAmount"),
                    args: [new AddressValue(new Address(address))],
                })
            )
            .then(({ returnData }) => {
                const values = queryContractParser(
                    returnData[returnData.length - 1],
                    "BigUint"
                );
                setRewardLPAmt(values[0]?.valueOf() || new BigNumber(0));
            });
    }, [loggedIn, proxy, address, setRewardLPAmt]);

    const getTotalLockedAmt = useCallback(() => {
        proxy
            .queryContract(
                new Query({
                    address: new Address(
                        ASHSWAP_CONFIG.dappContract.voteEscrowedContract
                    ),
                    func: new ContractFunction("totalLock"),
                })
            )
            .then(({ returnData }) => {
                const values = queryContractParser(returnData[0], "BigUint");
                setTotalLockedAmt(values[0]?.valueOf() || new BigNumber(0));
            });
    }, [proxy, setTotalLockedAmt]);

    const getRewardLPID = useCallback(() => {
        proxy
            .queryContract(
                new Query({
                    address: new Address(
                        ASHSWAP_CONFIG.dappContract.feeDistributor
                    ),
                    func: new ContractFunction("token"),
                })
            )
            .then(({ returnData }) => {
                const tokenID = Buffer.from(returnData[0], "base64").toString(
                    "utf8"
                );
                const p = pools.find((p) => p.lpToken.id === tokenID);
                if (p) {
                    setRewardLPToken(p);
                }
            });
    }, [proxy, setRewardLPToken]);

    const getRewardValue = useCallback(async () => {
        if (!rewardLPAmt || rewardLPAmt.eq(0) || !rewardLPToken) {
            setRewardValue(new BigNumber(0));
            return;
        }
        const { lpValueUsd: value } = await getLPValue(
            rewardLPAmt,
            rewardLPToken
        );
        setRewardValue(value || new BigNumber(0));
    }, [rewardLPAmt, rewardLPToken, getLPValue, setRewardValue]);

    const getASHTotalSupply = useCallback(() => {
        return apiProvider
            .getDefinitionOfFungibleToken(ASH_TOKEN.id)
            .then(({ supply }) => {
                return toWei(ASH_TOKEN, supply.toString(10) || "0");
            });
    }, [apiProvider]);

    const getTotalLockedASHPct = useCallback(async () => {
        const totalSupply = await getASHTotalSupply();
        if (totalSupply.eq(0)) setTotalLockedPct(0);
        return setTotalLockedPct(
            totalLockedAmt.multipliedBy(100).div(totalSupply).toNumber()
        );
    }, [getASHTotalSupply, totalLockedAmt, setTotalLockedPct]);

    useEffect(() => {
        getRewardValue();
    }, [getRewardValue]);

    useInterval(getVEASHAmt, blockTimeMs);
    useInterval(getLockedAmt, blockTimeMs);
    useInterval(getTotalSupplyVeASH, blockTimeMs);
    useInterval(getRewardAmt, blockTimeMs);
    useInterval(getTotalLockedAmt, blockTimeMs);
    useInterval(getTotalLockedASHPct, blockTimeMs);

    useEffect(() => {
        getRewardLPID();
    }, [getRewardLPID]);

    return null;
};

export default GovState;
