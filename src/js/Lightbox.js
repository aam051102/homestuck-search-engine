import React from "react";
import { MdClose } from "react-icons/md";

import "../css/Lightbox.scss";

const Lightbox = (props) => {
    return (
        <div
            className={`lightbox${props.visible ? " visible" : ""}`}
            onClick={(e) => {
                if (e.target.tagName !== "IMG") {
                    props.hideLightbox();
                }
            }}
        >
            <img src={props.image} alt="Lighthouse" />
            <button className="lightbox-close">
                <MdClose />
            </button>
        </div>
    );
};

export default Lightbox;
