import React from "react";
import { Helmet } from "react-helmet-async";

import Background from "components/Background";

import bgImage from "assets/images/bg.png";

import "./index.scss";

type IProps = {
    className?: string;
    title?: string;
};

const Layout: React.FC<IProps> = (props) => {
    return (
        <main className={`main ${props.className || ""}`}>
            <Helmet>
                <title>{props.title}</title>
                <meta
                    name="google-site-verification"
                    content="EwCR20L7XzRSB65nUy-ZPMiQNO1PTssbOlv4ch_ZSuU"
                />
            </Helmet>

            <Background src={bgImage} />

            <div className="page-content">{props.children}</div>
        </main>
    );
};

export default Layout;
