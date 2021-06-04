import React from "react";
import { Helmet } from "react-helmet-async";

import Background from "components/Background";

import bgImage from "assets/images/bg.png";

import "./index.scss";

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
