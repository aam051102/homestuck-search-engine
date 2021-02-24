import React from "react";
import { MdClose } from "react-icons/md";

import "../css/Lightbox.scss";

const Lightbox = (props) => {
    return (
        <div className={`lightbox${props.visible ? " visible" : ""}`}>
            <img src={props.image} alt="Lighthouse" />
            <button className="lightbox-close" onClick={props.hideLightbox}>
                <MdClose />
            </button>
        </div>
    );
};

export default Lightbox;
