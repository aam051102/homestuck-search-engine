import { useEffect, useRef } from "react";

/**
 * useEventListener from https://usehooks.com/useEventListener/
 * @param eventName The event to listen to
 * @param handler The function to be called when the event occurs
 * @param element The element which listens to the event
 */
function useEventListener<T extends keyof WindowEventMap>(
    eventName: T,
    handler: (e: WindowEventMap[T]) => void,
    element: HTMLElement | Window | Document = window
) {
    // Create a ref that stores handler
    const savedHandler = useRef<(e: WindowEventMap[T]) => void>();

    // Update ref.current value if handler changes.
    // This allows our effect below to always get latest handler ...
    // ... without us needing to pass it in effect deps array ...
    // ... and potentially cause effect to re-run every render.
    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(
        () => {
            // Make sure element supports addEventListener
            // On
            const isSupported = element && element.addEventListener;
            if (!isSupported) return;

            // Create event listener that calls handler function stored in ref
            const eventListener = (event: WindowEventMap[T]) =>
                savedHandler.current && savedHandler.current(event);

            // Add event listener
            element.addEventListener(
                eventName,
                eventListener as (e: Event) => void
            );

            // Remove event listener on cleanup
            return () => {
                element.removeEventListener(
                    eventName,
                    eventListener as (e: Event) => void
                );
            };
        },
        [eventName, element] // Re-run if eventName or element changes
    );
}

export default useEventListener;
