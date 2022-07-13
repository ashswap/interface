import React, { useCallback, useMemo } from "react";
import moment from "moment";
import { logarithmicRest, storage } from "@elrondnetwork/dapp-core/utils";

interface Props {
    id: string;
    done: boolean;
    children: React.ReactNode;
    expiresIn?: number;
    progress: {
        startTime: number;
        endTime: number;
    };
}

const ToastProgress = ({
    id,
    children,
    progress: { startTime, endTime },
    done,
    expiresIn = 1 * 60,
}: Props) => {
    const ref = React.useRef(null);
    const intervalRef = React.useRef<any>();
    const removeTxFromSession = useCallback(() => {
        const toastProgress = storage.session.getItem("toastProgress");
        const hasSessionStoredTx = Boolean(toastProgress?.[id]);

        if (!hasSessionStoredTx) {
            return;
        }

        delete toastProgress[id];

        storage.session.setItem({
            key: "toastProgress",
            data: toastProgress,
            expires: moment().add(expiresIn, "seconds").unix(),
        });
    }, [id]);

    const saveToSession = useCallback(
        ({ value }: { value: number }) => {
            const toastProgress =
                storage.session.getItem("toastProgress") || {};
            toastProgress[id] = value;
            storage.session.setItem({
                key: "toastProgress",
                data: toastProgress,
                expires: moment().add(expiresIn, "seconds").unix(),
            });
        },
        [id]
    );

    const { totalSeconds, currentRemaining } = useMemo(() => {
        const totalSeconds = endTime - startTime;
        const toastProgress = storage.session.getItem("toastProgress");
        const remaining = ((endTime - moment().unix()) * 100) / totalSeconds;

        const currentRemaining =
            toastProgress && id in toastProgress
                ? toastProgress[id]
                : remaining;
        return { currentRemaining, totalSeconds };
    }, [id, startTime, endTime]);

    const [percentRemaining, setPercentRemaining] =
        React.useState<number>(currentRemaining);

    React.useEffect(() => {
        const maxPercent = 90;
        const perc = totalSeconds / maxPercent;
        const int = moment.duration(perc.toFixed(2), "s").asMilliseconds();

        if (done) {
            intervalRef.current = setInterval(() => {
                if (ref.current !== null) {
                    setPercentRemaining((existing) => {
                        const value = existing - 1;
                        if (value <= 0) {
                            clearInterval(intervalRef.current);
                            removeTxFromSession();
                            return 0;
                        } else {
                            saveToSession({ value });
                            return value;
                        }
                    });
                }
            }, 5);
        } else {
            intervalRef.current = setInterval(() => {
                if (ref.current !== null) {
                    setPercentRemaining((existing) => {
                        const decrement =
                            existing > 100 - maxPercent
                                ? 1
                                : logarithmicRest(existing);
                        const value = existing - decrement;
                        saveToSession({ value });
                        return value;
                    });
                }
            }, int);
        }

        return () => {
            clearInterval(intervalRef.current);
        };
    }, [done, removeTxFromSession, saveToSession, totalSeconds]);

    return (
        <div className="progress position-relative" ref={ref}>
            <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${percentRemaining}%` }}
                aria-valuenow={percentRemaining}
                aria-valuemin={0}
                aria-valuemax={100}
            ></div>
            <div className="d-flex position-absolute w-100">{children}</div>
        </div>
    );
};

export default ToastProgress;
