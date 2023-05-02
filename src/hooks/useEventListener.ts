import { useEffect, useRef } from "react";

/**
 * Listen for KeyBoard events with handler function
 * @param handler function to call on event trigger
 * @param eventTypes type of event to listen for (e.g. "resize")
 * @param el HTML element on which to bind event listener
 * @param removeListener setting to true will remove the eventListener
 */
export default function useEventListener<T extends keyof WindowEventMap>(
    eventType: T,
    handler: (event: WindowEventMap[T]) => void,
    el: HTMLElement | null | Document = null,
    removeListener = false,
    listenerOptions?: AddEventListenerOptions
): void {
    // Create a ref that stores handler
    const savedHandler = useRef<(event: WindowEventMap[T]) => void>();

    // Update ref.current value if handler changes.
    // This allows our effect below to always get latest handler ...
    // ... without us needing to pass it in effect deps array ...
    // ... and potentially cause effect to re-run every render.
    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        if (removeListener) return;

        const eventListener = (event: WindowEventMap[T]) => {
            savedHandler.current && savedHandler.current(event);
        };

        // Bind the event listener
        (el || window).addEventListener(
            eventType,
            eventListener as (e: Event) => void,
            listenerOptions
        );

        return () => {
            // Unbind the event listener on clean up
            (el || window).removeEventListener(
                eventType,
                eventListener as (e: Event) => void,
                listenerOptions
            );
        };
    }, [el, removeListener, listenerOptions, eventType]);
}
