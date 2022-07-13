import * as Sentry from "@sentry/react";
import { accAddressState } from "atoms/dappState";
import { useEffect } from "react";
import { useRecoilValue } from "recoil";

function useSentryUser() {
    const address = useRecoilValue(accAddressState);
    useEffect(() => {
        if (address) {
            Sentry.setUser({ account: address });
        }
    }, [address]);
}

export default useSentryUser;
