import React, { useState } from "react";
import { MdChevronLeft } from "react-icons/md";

import "./index.scss";

const Sidebar = (props) => {
    const [showSidebar, setShowSidebar] = useState(props.isOpen);
    const sidebarVisible = props.onToggle ? props.isOpen : showSidebar;

    return (
        <>
            <aside className={`sidebar${sidebarVisible ? " visible" : ""}`}>
                <div
                    className={`sidebar-controls ${
                        sidebarVisible ? "close" : "open"
                    }`}
                >
                    <button
                        className={`sidebar-button ${
                            sidebarVisible ? "close" : "open"
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
                            <svg
                                className="delete-icon"
                                stroke="currentColor"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                height="1em"
                                width="1em"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    className="delete-lid"
                                    d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                                ></path>
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"></path>
                            </svg>
                        </button>
                    ) : null}
                </div>

                <div className="sidebar-inner">{props.children}</div>
            </aside>
        </>
    );
};

export default Sidebar;
