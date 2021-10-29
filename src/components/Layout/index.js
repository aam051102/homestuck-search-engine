import React, { useLayoutEffect } from "react";
import { Helmet } from "react-helmet";

import Background from "components/Background";

import bgImage from "assets/images/bg.png";

import "./index.scss";

function Layout(props) {
    useLayoutEffect(() => {
        const inlineScript = document.createElement("script");

        inlineScript.innerHTML = `window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'UA-78420552-1')`;

        document.body.appendChild(inlineScript);

        return () => {
            document.body.removeChild(inlineScript);
        };
    }, []);

    return (
        <main className={`main ${props.className || ""}`}>
            <Helmet>
                <title>{props.title}</title>
            </Helmet>

            {/* Global site tag (gtag.js) - Google Analytics */}
            <script async src="https://www.googletagmanager.com/gtag/js?id=UA-78420552-1"></script>

            <Background src={bgImage} />

            <div className="page-content">{props.children}</div>
        </main>
    );
}

export default Layout;
