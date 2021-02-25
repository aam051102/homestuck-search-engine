import React from "react";
import { MdChevronLeft, MdChevronRight, MdClose } from "react-icons/md";

import useEventListener from "./useEventListener";
import "../css/Lightbox.scss";
import Sidebar from "./Sidebar";

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

    return props.results.length > props.id ? (
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

            <a
                href={props.results[props.id].url}
                target="_blank"
                rel="noopener noreferrer"
            >
                {props.results[props.id].type === 0 ? (
                    <img
                        src={props.results[props.id].content}
                        alt="Lightbox Panel"
                    />
                ) : null}
                {props.results[props.id].type === 1 ? (
                    <div>
                        <p>Flash not functional.</p>
                    </div>
                ) : null}
            </a>

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

            <Sidebar title="Tags">
                <ul className="sidebar-text">
                    {props.results[props.id].tags.map((tag, i) => {
                        return <li key={i}>{tag}</li>;
                    })}
                </ul>
            </Sidebar>
        </div>
    ) : null;
};

export default Lightbox;
