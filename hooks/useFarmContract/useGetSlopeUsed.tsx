import { getProxyProvider } from "@elrondnetwork/dapp-core";
import { Address, AddressValue, ContractFunction, ProxyProvider, Query } from "@elrondnetwork/erdjs/out";
import BigNumber from "bignumber.js";
import { queryContractParser } from "helper/serializer";
import { useRecoilCallback } from "recoil";

const useGetSlopeUsed = () => {
    const func = useRecoilCallback(({snapshot, set}) => async (farmAddress: string, ownerAddress: string) => {
        const proxy: ProxyProvider = getProxyProvider();
        const {returnData} = await proxy.queryContract(new Query({
            address: new Address(farmAddress),
            func: new ContractFunction("getSlopeBoosted"),
            args: [new AddressValue(new Address(ownerAddress))]
        }));
        const slope: BigNumber = returnData[0] ? queryContractParser(returnData[0], "BigUint")[0].valueOf() || new BigNumber(0) : new BigNumber(0);
        return slope;
    }, []);
    return func;
};

export default useGetSlopeUsed;