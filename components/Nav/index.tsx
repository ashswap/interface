import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback } from "react";
import styles from "./Nav.module.css";
import SocialMenu from "./SocialMenu";
import ICPool from "assets/svg/pool.svg";
import ICSwap from "assets/svg/swap.svg";
import ICChart from "assets/svg/chart.svg";
import ICNewTab from "assets/svg/new-tab.svg";
import ICStake from "assets/svg/stake.svg";
import StakeMenu from "./StakeMenu";

const Nav = () => {
    const router = useRouter();

    const isActive = useCallback(
        (path: string, exact = true) => {
            return exact
                ? router.route === path
                : router.route.startsWith(path);
        },
        [router]
    );

    return (
        <div
            className={`${styles.container} text-black dark:text-white sm:space-x-[0.375rem]`}
        >
            <Link href="/swap" passHref>
                <div
                    className={`transition ${styles.btn} ${
                        isActive("/swap") ? styles.active : ""
                    }`}
                >
                    <ICSwap className="inline-block w-4 h-4 md:mr-2 transition-none" />
                    <span className="inline-block">Swap</span>
                </div>
            </Link>
            <Link href="/pool" passHref>
                <div
                    className={`transition ${styles.btn} ${
                        isActive("/pool") ? styles.active : ""
                    }`}
                >
                    <ICPool className="inline-block w-4 h-4 md:mr-2 transition-none" />
                    <span className="inline-block">Pool</span>
                </div>
            </Link>
            {/* <Link href="/stake/gov" passHref>
                <div
                    className={`transition ${styles.btn} ${
                        isActive("/stake/gov", false) ? styles.active : ""
                    }`}
                >
                    <ICStake className="inline-block w-4 h-4 md:mr-2 transition-none" />
                    <span className="inline-block">Stake</span>
                </div>
            </Link> */}
            <StakeMenu/>
            <Link href="/info" passHref>
                <a target="_blank">
                    <div
                        className={`transition ${styles.btn} ${
                            isActive("/info") ? styles.active : ""
                        }`}
                    >
                        <ICChart className="inline-block w-4 h-4 md:mr-2 transition-none" />
                        <div className="flex items-center">
                            <span className="inline-block mr-1 truncate">Analytic</span>
                            <ICNewTab className="inline-block w-2.5 h-2.5 transition-none" />
                        </div>
                    </div>
                </a>
            </Link>
            <SocialMenu />
        </div>
    );
};

export default Nav;
