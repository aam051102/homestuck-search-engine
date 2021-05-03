import React, { useState } from "react";
import { MdChevronLeft, MdDelete } from "react-icons/md";

import "../../css/Sidebar.scss";

const Sidebar = (props) => {
    const [showSidebar, setShowSidebar, ] = useState(props.isOpen);
    const sidebarVisible = (props.onToggle ?
        props.isOpen :
        showSidebar);

    return (
        <>
            <aside className={`sidebar${sidebarVisible ? 
                " visible" :
                ""}`}>
                <div
                    className={`sidebar-controls ${
                        sidebarVisible ?
                            "close" : 
                            "open"
                    }`}
                >
                    <button
                        className={`sidebar-button ${
                            sidebarVisible ?
                                "close" :
                                "open"
                        }`}
                        onClick={() => {
                            if (props.onToggle) {
                                props.onToggle(!sidebarVisible);
                            } else {
                                setShowSidebar(!sidebarVisible);
                            }
                        }}
                        aria-label="Toggle sidebar"
                    >
                        <MdChevronLeft />
                        <h2>{props.title}</h2>
                    </button>

                    {props.clearSearch ? (
                        <button
                            className="sidebar-button"
                            onClick={props.clearSearch}
                            aria-label="Clear search"
                        >
                            <MdDelete />
                        </button>
                    ) : null}
                </div>

                <div className="sidebar-inner">{props.children}</div>
            </aside>
        </>
    );
};

export default Sidebar;
