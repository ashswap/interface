import {
    useGetFailedTransactions,
    useGetSuccessfulTransactions,
} from "@elrondnetwork/dapp-core/hooks";
import { useEffect, useMemo } from "react";
import { useFetchBalances } from "./useFetchBalances";

export const useRefreshAfterTxCompleted = () => {
    const { failedTransactionsArray } = useGetFailedTransactions();
    const { successfulTransactionsArray } = useGetSuccessfulTransactions();
    const fetchBalances = useFetchBalances();
    const txsCount = useMemo(() => {
        return (
            failedTransactionsArray.length + successfulTransactionsArray.length
        );
    }, [failedTransactionsArray.length, successfulTransactionsArray.length]);
    useEffect(() => {
        if (txsCount > 0) {
            fetchBalances();
        }
    }, [txsCount, fetchBalances]);
};
