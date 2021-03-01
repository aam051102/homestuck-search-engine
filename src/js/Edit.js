import { Redirect } from "@reach/router";
import React from "react";

import "../css/Edit.scss";
import Background from "./Background";

import Layout from "./Layout";

function EditPage(props) {
    return props ? (
        <Layout className="edit-page" title="Edit Tags">
            <Background src="https://pipe.miroware.io/5bc7665ecc3313406322aba0/dirk_bg_earthC.png" />
        </Layout>
    ) : (
        <Redirect to="/login" />
    );
}

export default EditPage;
