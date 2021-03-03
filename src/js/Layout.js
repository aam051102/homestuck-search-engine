import { Link } from "@reach/router";
import React from "react";
import { Helmet } from "react-helmet-async";

import {
    MdEdit,
    MdSearch,
    MdSettings,
    MdSupervisorAccount,
} from "react-icons/md";

import "../css/Layout.scss";
import Background from "./Background";

function Layout(props) {
    return (
        <main className={`main ${props.className || ""}`}>
            <Helmet>
                <title>{props.title}</title>
            </Helmet>

            <Background src="https://pipe.miroware.io/5bc7665ecc3313406322aba0/dirk_bg_earthC.png" />

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
