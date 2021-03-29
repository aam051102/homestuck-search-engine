import React from "react";
import { Helmet } from "react-helmet-async";

import Background from "./Background";

import bgImage from "../../images/bg.png";
import "../../css/Layout.scss";

function Layout(props) {
    return (
        <main className={`main ${props.className || ""}`}>
            <Helmet>
                <title>{props.title}</title>
            </Helmet>

            <Background src={bgImage} />

            <div className="page-content">{props.children}</div>
        </main>
    );
}

export default Layout;
