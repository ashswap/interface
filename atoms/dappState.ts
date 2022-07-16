import {
    AccountInfoSliceType,
    LoginInfoStateType,
    ModalsSliceState,
    NetworkConfigStateType,
    ToastsSliceState,
    TransactionsSliceStateType,
} from "@elrondnetwork/dapp-core/reduxStore/slices";
import {
    LoginMethodsEnum,
    TransactionsDisplayInfoType,
} from "@elrondnetwork/dapp-core/types";
import BigNumber from "bignumber.js";
import { atom, selector } from "recoil";

export type DappCoreState = {
    account: AccountInfoSliceType;
    dappModal: ModalsSliceState;
    loginInfo: LoginInfoStateType;
    modals: ModalsSliceState;
    networkConfig: NetworkConfigStateType;
    toasts: ToastsSliceState;
    transactions: TransactionsSliceStateType;
    transactionsInfo: Record<string, TransactionsDisplayInfoType>;
};

export const dappCoreState = atom<DappCoreState>({
    key: "dapp_core_state",
    default: {
        account: {
            account: {
                address: "",
                balance: "",
                nonce: 0,
            },
            accountLoadingError: null,
            address: "",
            isAccountLoading: false,
            ledgerAccount: null,
            publicKey: "",
            walletConnectAccount: null,
            shard: 0,
        },
        dappModal: {},
        loginInfo: {
            extensionLogin: null,
            ledgerLogin: null,
            loginMethod: "",
            tokenLogin: null,
            walletConnectLogin: null,
            walletLogin: null,
        },
        modals: {},
        networkConfig: {
            chainID: "",
            network: {},
        },
        toasts: { customToasts: [], transactionToasts: [] },
        transactions: {
            customTransactionInformationForSessionId: {},
            signedTransactions: {},
            signTransactionsError: null,
            transactionsToSign: null,
        },
        transactionsInfo: {},
    },
});

export const accInfoState = selector<DappCoreState["account"]>({
    key: "dapp_acc_info",
    get: ({ get }) => get(dappCoreState).account,
});

export const loginInfoState = selector<DappCoreState["loginInfo"]>({
    key: "dapp_login_info",
    get: ({ get }) => get(dappCoreState).loginInfo,
});

export const networkConfigState = selector<DappCoreState["networkConfig"]>({
    key: "dapp_network_config",
    get: ({ get }) => get(dappCoreState).networkConfig,
});

export const accIsLoggedInState = selector<boolean>({
    key: "dapp_acc_is_logged_in",
    get: ({ get }) => {
        const loginInfo = get(loginInfoState);
        const address = get(accAddressState);
        return (
            loginInfo.loginMethod != LoginMethodsEnum.none && Boolean(address)
        );
    },
});

export const accAddressState = selector<string>({
    key: "dapp_acc_address",
    get: ({ get }) => get(dappCoreState).account.address,
});

export const accBalanceState = selector<BigNumber>({
    key: "dapp_acc_egld_balance",
    get: ({ get }) =>
        new BigNumber(get(dappCoreState).account.account.balance || 0),
});

export const accIsInsufficientEGLDState = selector<boolean>({
    key: "dapp_acc_is_insufficient_egld",
    get: ({ get }) => get(accBalanceState).eq(0),
});
