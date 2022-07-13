import {
    Address,
    AddressValue,
    ContractFunction,
    Query,
} from "@elrondnetwork/erdjs/out";
import BigNumber from "bignumber.js";
import { getProxyNetworkProvider } from "helper/proxy/util";
import { queryContractParser } from "helper/serializer";
import { useRecoilCallback } from "recoil";

const useGetSlopeUsed = () => {
    const func = useRecoilCallback(
        ({ snapshot, set }) =>
            async (farmAddress: string, ownerAddress: string) => {
                const proxy = getProxyNetworkProvider();
                const { returnData } = await proxy.queryContract(
                    new Query({
                        address: new Address(farmAddress),
                        func: new ContractFunction("getSlopeBoosted"),
                        args: [new AddressValue(new Address(ownerAddress))],
                    })
                );
                const slope: BigNumber = returnData[0]
                    ? queryContractParser(
                          returnData[0],
                          "BigUint"
                      )[0].valueOf() || new BigNumber(0)
                    : new BigNumber(0);
                return slope;
            },
        []
    );
    return func;
};

export default useGetSlopeUsed;
