import React, { useState } from "react";
import { MdChevronLeft } from "react-icons/md";

import "../css/Sidebar.scss";

const Sidebar = (props) => {
    const [showSidebar, setShowSidebar] = useState(false);

    return (
        <>
            <button
                className={`sidebar-button ${showSidebar ? "close" : "open"}`}
                onClick={() => {
                    setShowSidebar(!showSidebar);
                }}
            >
                <MdChevronLeft />
                <h2>{props.title}</h2>
            </button>

            <aside className={`sidebar${showSidebar ? " visible" : ""}`}>
                {props.children}
            </aside>
        </>
    );
};

export default Sidebar;
