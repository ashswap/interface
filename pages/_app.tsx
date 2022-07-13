import { DappProvider } from "@elrondnetwork/dapp-core/wrappers";
import ConnectWalletModal from "components/ConnectWalletModal";
import ErrorBoundary from "components/ErrorBoundary";
import SignTxNotification from "components/SignTxNotification";
import SignTxsModal from "components/SignTxsModal";
import TxsToastList from "components/TxsToastList";
import { DAPP_CONFIG } from "const/dappConfig";
import { ENVIRONMENT } from "const/env";
import { useRecoilAdapter } from "hooks/useRecoilAdapter";
import { useRefreshAfterTxCompleted } from "hooks/useRefreshAfterTxCompleted";
import useSentryUser from "hooks/useSentryUser";
import { NextPage } from "next";
import { NextSeo } from "next-seo";
import { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import Script from "next/script";
import {
    Fragment,
    ReactElement,
    ReactNode,
    useEffect,
    useMemo,
    useState,
} from "react";
import { RecoilRoot } from "recoil";
import * as gtag from "../helper/gtag";
import "../styles/globals.css";

type NextPageWithLayout = NextPage & {
    getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
    Component: NextPageWithLayout;
};
const ProductionErrorBoundary =
    process.env.NODE_ENV === "production" ? ErrorBoundary : Fragment;
// const ProductionErrorBoundary = ErrorBoundary;
const GlobalHooks = () => {
    // setup recoil
    useRecoilAdapter();
    useSentryUser();
    useRefreshAfterTxCompleted();
    return null;
};
const TestnetGuard = ({ children }: any) => {
    const [pass, setPass] = useState("");
    const [inputPass, setInputPass] = useState("");
    const authorized = useMemo(() => {
        return pass === ENVIRONMENT.TESTNET_PASS;
    }, [pass]);
    useEffect(() => {
        setPass(localStorage.getItem("testnet_pass") || "");
    }, []);
    useEffect(() => {
        localStorage.setItem("testnet_pass", pass);
    }, [pass]);
    if (
        ENVIRONMENT.NETWORK === "testnet" &&
        process.env.NODE_ENV === "production" &&
        !authorized
    )
        return (
            <div className="w-screen h-screen bg-ash-dark-600 flex flex-col items-center justify-center px-6 text-center">
                <div className="text-3xl text-white font-bold mb-20">
                    Official testing version of AshSwap is in{" "}
                    <a href="https://devnet.ashswap.io">
                        <span className="text-pink-600 underline">Devnet</span>
                    </a>{" "}
                    now
                </div>
                <input
                    type="password"
                    className="bg-stake-dark-400 h-12 px-6 text-sm mb-10"
                    value={inputPass}
                    onChange={(e) => setInputPass(e.target.value)}
                    onKeyUp={(e) => e.key === "Enter" && setPass(inputPass)}
                />
                <button
                    className="h-12 px-6 flex items-center text-white bg-pink-600 font-bold"
                    onClick={() => setPass(inputPass)}
                >
                    Enter
                </button>
                {pass !== "" && pass !== ENVIRONMENT.TESTNET_PASS && (
                    <div className="text-sm mt-4">Incorrect password</div>
                )}
            </div>
        );
    return <>{children}</>;
};
function MyApp({ Component, pageProps }: AppPropsWithLayout) {
    const router = useRouter();
    const getLayout = Component.getLayout ?? ((page) => page);

    useEffect(() => {
        const handleRouteChange = (url: string) => {
            gtag.pageview(url);
        };

        router.events.on("routeChangeComplete", handleRouteChange);
        return () => {
            router.events.off("routeChangeComplete", handleRouteChange);
        };
    }, [router.events]);
    console.log("abs");
    return (
        <>
            {/* Global Site Tag (gtag.js) - Google Analytics */}
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_TRACKING_ID}`}
            />
            <Script
                id="gtag-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${gtag.GA_TRACKING_ID}', {
                    page_path: window.location.pathname,
                    });
                `,
                }}
            />
            <Head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
            </Head>
            <NextSeo
                title="AshSwap Interface"
                description="Swap or provide liquidity on the AshSwap Protocol."
            />

            <RecoilRoot>
                <DappProvider
                    environment={ENVIRONMENT.NETWORK}
                    customNetworkConfig={DAPP_CONFIG}
                    // completedTransactionsDelay={500}
                >
                    <TestnetGuard>
                        <GlobalHooks />
                        <ProductionErrorBoundary>
                            {/* <Component {...pageProps} /> */}
                            {getLayout(<Component {...pageProps} />)}
                            <ConnectWalletModal />
                        </ProductionErrorBoundary>
                        <div className="fixed bottom-24 left-6 right-6 sm:bottom-12 sm:left-auto sm:right-12 z-toast flex flex-col items-end sm:max-w-[480px] space-y-2 sm:space-y-4">
                            <SignTxNotification />
                            <SignTxsModal />
                            <div className="absolute top-0 right-0 -translate-y-full pb-4 sm:pb-8">
                                <TxsToastList />
                            </div>
                        </div>
                    </TestnetGuard>
                </DappProvider>
            </RecoilRoot>
        </>
    );
}

export default MyApp;
