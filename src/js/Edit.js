import { Redirect } from "@reach/router";
import React from "react";

import "../css/Edit.scss";

import Layout from "./Layout";

function EditPage(props) {
    return props ? (
        <Layout className="edit-page" title="Edit Tags"></Layout>
    ) : (
        <Redirect to="/login" />
    );
}

export default EditPage;
