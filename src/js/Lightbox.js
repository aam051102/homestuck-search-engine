import React from "react";
import { MdChevronLeft, MdChevronRight, MdClose } from "react-icons/md";

import "../css/Lightbox.scss";

const Lightbox = (props) => {
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
                className="lightbox-btn-clear lightbox-left"
                onClick={() => {
                    // TODO: Load previous
                }}
            >
                <MdChevronLeft />
            </button>
            <img src={props.image} alt="Lighthouse" />
            <button
                className="lightbox-btn-clear lightbox-right"
                onClick={() => {
                    // TODO: Load next
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
