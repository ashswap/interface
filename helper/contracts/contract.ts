import { ResultsParser } from "@elrondnetwork/erdjs/out";
import { getProxyNetworkProvider } from "../proxy/util";

export default class Contract {
    resultParser = new ResultsParser();
    getProxy() {
        return getProxyNetworkProvider();
    }
}
