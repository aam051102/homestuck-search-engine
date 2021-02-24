import { Link } from "@reach/router";
import React from "react";

import {
    MdEdit,
    MdSearch,
    MdSettings,
    MdSupervisorAccount,
} from "react-icons/md";

import "../css/Layout.scss";

function Layout(props) {
    return (
        <main className={`main ${props.className || ""}`}>
            <div className="main-middle">{props.children}</div>
            <div className="system">
                <Link to="/">
                    <MdSearch />
                </Link>
                <Link to="/settings">
                    <MdSettings />
                </Link>
                <Link className="edit-link" to="/edit">
                    <MdEdit />
                </Link>
            </div>

            <div className="user">
                <MdSupervisorAccount className="mod-icon" />
            </div>
        </main>
    );
}

export default Layout;
