import { compareArr } from "helpers/utility";
import { useEffect, useRef, useState } from "react";

export default function useTimeout(
    callback: () => void,
    delay: number | null,
    dependencies: unknown[] = []
): void {
    const savedCallback = useRef<() => void | undefined>();

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Prevents redefinition by comparing dependencies.
    const [savedDependencies, setSavedEventTypes] = useState<unknown[]>([]);

    useEffect(() => {
        if (!compareArr(dependencies, savedDependencies)) {
            setSavedEventTypes(dependencies);
        }
    }, [dependencies, savedDependencies]);

    // Set up the interval.
    useEffect(() => {
        function tick() {
            if (savedCallback.current) savedCallback.current();
        }

        if (delay !== null) {
            const id = setTimeout(tick, delay);
            return () => clearTimeout(id);
        }
    }, [delay, savedDependencies]);
}
