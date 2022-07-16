import {
    AbiRegistry,
    Address,
    BigUIntValue,
    ContractFunction,
    Query,
    SmartContract,
    SmartContractAbi,
    TokenIdentifierValue,
} from "@elrondnetwork/erdjs";
import BigNumber from "bignumber.js";
import { queryContractParser } from "helper/serializer";
import IPool from "interface/pool";
import Contract from "./contract";
import poolAbi from "assets/abi/pool.abi.json";
import { getProxyNetworkProvider } from "../proxy/util";
import { ContractQueryResponse } from "@elrondnetwork/erdjs-network-providers/out";

const getAmountOutMaiarPool = async (
    poolAddress: string,
    tokenFromId: string,
    amountIn: BigNumber
): Promise<BigNumber> => {
    const proxy = getProxyNetworkProvider();
    try {
        const { returnData } = await proxy.queryContract(
            new Query({
                address: new Address(poolAddress),
                func: new ContractFunction("getAmountOut"),
                args: [
                    new TokenIdentifierValue(tokenFromId),
                    new BigUIntValue(amountIn),
                ],
            })
        );
        return (
            queryContractParser(returnData[0], "BigUint")?.[0]?.valueOf() ||
            new BigNumber(0)
        );
    } catch (error) {}
    return new BigNumber(0);
};

const calculateAmountOut = async (
    pool: IPool,
    tokenFromId: string,
    tokenToId: string,
    amountIn: BigNumber
) => {
    if (pool.isMaiarPool) {
        return await getAmountOutMaiarPool(pool.address, tokenFromId, amountIn);
    }
    return await new PoolContract(pool.address)
        .getAmountOut(tokenFromId, tokenToId, amountIn)
        .then((val) => val.amount_out);
};

const getReserveMaiarPool = async (pool: IPool) => {
    const proxy = getProxyNetworkProvider();
    const res = await proxy.queryContract(
        new Query({
            address: new Address(pool.address),
            func: new ContractFunction("getReservesAndTotalSupply"),
        })
    );
    const [token1, token2, supply] = res.returnData.map(
        (data) => queryContractParser(data, "BigUint")[0].valueOf() as BigNumber
    );
    return {
        token1,
        token2,
        supply,
    };
};

const getFeePct = async (pool: IPool) => {
    const proxy = getProxyNetworkProvider();
    try {
        let feeRes: ContractQueryResponse;
        if (pool.isMaiarPool) {
            feeRes = await proxy.queryContract(
                new Query({
                    address: new Address(pool.address),
                    func: new ContractFunction("getTotalFeePercent"),
                })
            );
        } else {
            feeRes = await proxy.queryContract(
                new Query({
                    address: new Address(pool.address),
                    func: new ContractFunction("getSwapFeePercent"),
                })
            );
        }
        let fee = new BigNumber(
            "0x" + Buffer.from(feeRes.returnData[0], "base64").toString("hex")
        );

        fee = fee.div(new BigNumber(100000));
        return fee;
    } catch (error) {
        console.error(error);
    }
    return new BigNumber(0);
};

export const queryPoolContract = {
    getAmountOutMaiarPool,
    calculateAmountOut,
    getFeePct,
    getReserveMaiarPool,
};
class PoolContract extends Contract {
    address: Address;
    contract: SmartContract;
    constructor(address: string) {
        super();
        this.address = new Address(address);
        const abiRegistry = AbiRegistry.create(poolAbi as any);
        this.contract = new SmartContract({
            address: this.address,
            abi: new SmartContractAbi(abiRegistry),
        });
    }

    async getTotalSupply() {
        const interaction = this.contract.methods.getTotalSupply();
        const query = interaction.check().buildQuery();
        const res = await this.getProxy().queryContract(query);
        const { firstValue } = this.resultParser.parseQueryResponse(
            res,
            interaction.getEndpoint()
        );
        const supply = firstValue?.valueOf() || new BigNumber(0);
        return supply as BigNumber;
    }

    async getAmountOut(
        tokenFromId: string,
        tokenToId: string,
        amountIn: BigNumber
    ): Promise<{
        admin_fee: BigNumber;
        amount_out: BigNumber;
        token_in_balance: BigNumber;
        token_out_balance: BigNumber;
        total_fee: BigNumber;
    }> {
        const interaction = this.contract.methods.getAmountOut([
            tokenFromId,
            tokenToId,
            amountIn,
        ]);
        const query = interaction.check().buildQuery();
        const res = await this.getProxy().queryContract(query);
        const { firstValue } = this.resultParser.parseQueryResponse(
            res,
            interaction.getEndpoint()
        );
        return firstValue?.valueOf() as any;
    }

    async getRemoveLiquidityTokens(lp: BigNumber): Promise<{
        first_token_amount: BigNumber;
        second_token_amount: BigNumber;
        first_token_balance: BigNumber;
        second_token_balance: BigNumber;
    }> {
        const interaction = this.contract.methods.getRemoveLiquidityTokens([
            lp,
            new BigNumber(0),
            new BigNumber(0),
        ]);
        const query = interaction.check().buildQuery();
        const res = await this.getProxy().queryContract(query);
        const { firstValue } = this.resultParser.parseQueryResponse(
            res,
            interaction.getEndpoint()
        );
        return firstValue?.valueOf();
    }
}

export default PoolContract;
