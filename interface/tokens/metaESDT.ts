import BigNumber from "bignumber.js";
import { NFTType } from "./type";

export interface IMetaESDT {
    identifier: string;
    collection: string;
    attributes: string;
    nonce: number;
    type: NFTType;
    name: string;
    creator: string;
    isWhitelistedStorage: boolean;
    balance: BigNumber;
    supply?: BigNumber;
    decimals: number;
    ticker: string;
}
