import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { setIsSignedIn, useIsSignedIn } from "helpers/globalState";
import Layout from "components/Layout";

import "./index.scss";
import { checkIsSignedIn } from "helpers/utility";

const EditPage: React.FC = () => {
    const params = useParams();
    const [isSignedIn] = useIsSignedIn();
    const navigate = useNavigate();

    const id = params["id"] ? Number(params["id"]) : undefined;

    useEffect(() => {
        (async () => {
            const thisIsSignedIn = isSignedIn || (await checkIsSignedIn());

            if (thisIsSignedIn !== isSignedIn) {
                setIsSignedIn(thisIsSignedIn);
            }

            if (!thisIsSignedIn) {
                navigate(
                    window.location.hostname === "localhost"
                        ? "/"
                        : "/app/hsse/login"
                );
            }
        })();
    }, [isSignedIn]);

    return (
        <Layout
            className="edit-page"
            title="Homestuck Search Engine | Edit"
        ></Layout>
    );
};

export default EditPage;
