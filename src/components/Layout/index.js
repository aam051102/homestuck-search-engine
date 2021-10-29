import React from "react";
import { Helmet } from "react-helmet";

import Background from "components/Background";

import bgImage from "assets/images/bg.png";

import "./index.scss";

function Layout(props) {
    return (
        <main className={`main ${props.className || ""}`}>
            <Helmet>
                <title>{props.title}</title>

                {/* Global site tag (gtag.js) - Google Analytics */}
                <script async src="https://www.googletagmanager.com/gtag/js?id=UA-78420552-1"></script>
                <script dangerouslySetInnerHTML={{__html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());

                    gtag('config', 'UA-78420552-1');
                    `}} />
            </Helmet>

            <Background src={bgImage} />

            <div className="page-content">{props.children}</div>
        </main>
    );
}

export default Layout;
