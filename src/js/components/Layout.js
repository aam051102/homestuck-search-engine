import React from "react";
import { Helmet } from "react-helmet-async";

import Background from "./Background";
import "../../css/Layout.scss";

function Layout(props) {
    return (
        <main className={`main ${props.className || ""}`}>
            <Helmet>
                <title>{props.title}</title>
            </Helmet>

            <Background src="https://pipe.miroware.io/5bc7665ecc3313406322aba0/dirk_bg_earthC.png" />

            <div className="page-content">{props.children}</div>
        </main>
    );
}

export default Layout;
