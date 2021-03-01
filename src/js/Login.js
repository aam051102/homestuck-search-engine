import React from "react";

import "../css/Login.scss";
import Background from "./Background";

import Layout from "./Layout";

function LoginPage() {
    return (
        <Layout className="login-page" title="Sign In">
            <Background src="https://pipe.miroware.io/5bc7665ecc3313406322aba0/dirk_bg_earthC.png" />
        </Layout>
    );
}

export default LoginPage;
