import React from "react";
import { MdChevronLeft, MdChevronRight, MdClose } from "react-icons/md";

import useEventListener from "./useEventListener";
import "../css/Lightbox.scss";

/**
 * A lightbox to show search results in
 * @param {Object} props
 */
const Lightbox = (props) => {
    // Shortcut listener
    useEventListener(
        "keyup",
        (e) => {
            if (props.visible) {
                if (e.key === "ArrowLeft") {
                    props.loadPrevious();
                } else if (e.key === "ArrowRight") {
                    props.loadNext();
                }
            }
        },
        document
    );

    return (
        <div
            className={`lightbox${props.visible ? " visible" : ""}`}
            onClick={(e) => {
                if (e.target.classList.contains("lightbox")) {
                    props.hideLightbox();
                }
            }}
        >
            <button
                className={`lightbox-btn-clear lightbox-left`}
                disabled={props.id <= 0 ? true : false}
                onClick={() => {
                    props.loadPrevious();
                }}
            >
                <MdChevronLeft />
            </button>
            <img
                src={
                    props.results.length > props.id
                        ? props.results[props.id].content
                        : ""
                }
                alt="Lighthouse"
            />
            <button
                className="lightbox-btn-clear lightbox-right"
                disabled={props.id >= props.results.length - 1 ? true : false}
                onClick={() => {
                    props.loadNext();
                }}
            >
                <MdChevronRight />
            </button>

            <button
                className="lightbox-btn-clear lightbox-close"
                onClick={props.hideLightbox}
            >
                <MdClose />
            </button>
        </div>
    );
};

export default Lightbox;
