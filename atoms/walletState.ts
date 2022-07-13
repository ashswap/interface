
import { FungibleTokenOfAccountOnNetwork } from "@elrondnetwork/erdjs-network-providers/out";
import { ITokenMap } from "interface/token";
import { atom } from "recoil";

export const walletLPMapState = atom<ITokenMap>({
    key: "wallet_lp_map",
    default: {},
});

export const walletBalanceState = atom<
    Record<string, FungibleTokenOfAccountOnNetwork | null>
>({
    key: "wallet_balances",
    default: {},
});

export const walletTokenPriceState = atom<Record<string, number>>({
    key: "wallet_token_prices",
    default: {},
});

export const walletIsOpenConnectModalState = atom<boolean>({
    key: "wallet_is_open_connect_modal",
    default: false,
});