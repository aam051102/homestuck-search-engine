import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

type IParams = Record<string, string | number | null | undefined | boolean>;

const useParams = <T extends IParams>(): [Partial<T>, React.Dispatch<T>] => {
    const [urlParams, setUrlParams] = useSearchParams();
    const [params, setParams] = useState<Partial<T>>({});

    const updateParams = useCallback(
        (params: T) => {
            const newParams: Record<string, string> = {};

            for (const key in params) {
                const param = params[key];

                if (param === true) {
                    newParams[key] = "true";
                } else if (param === false) {
                    newParams[key] = "false";
                } else if (param === null) {
                    newParams[key] = "null";
                } else if (param === undefined) {
                    newParams[key] = "undefined";
                } else {
                    newParams[key] = param.toString();
                }
            }

            setUrlParams(newParams);
        },
        [setUrlParams]
    );

    useEffect(() => {
        const newParams: Record<string, unknown> = {};

        urlParams.forEach((val, key) => {
            switch (val) {
                case "true":
                    newParams[key] = true;
                    break;

                case "false":
                    newParams[key] = false;
                    break;

                case "null":
                    newParams[key] = null;
                    break;

                case "undefined":
                    newParams[key] = undefined;
                    break;

                default: {
                    const propNumber = Number(val);

                    if (!isNaN(propNumber) && val.length > 0) {
                        newParams[key] = propNumber;
                    } else {
                        newParams[key] = val;
                    }

                    break;
                }
            }
        });

        setParams(newParams as Partial<T>);
    }, [urlParams]);

    return [params, updateParams];
};

export default useParams;
