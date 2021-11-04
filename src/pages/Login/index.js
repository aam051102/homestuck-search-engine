import React, {
    createRef, useEffect 
} from "react";
import { MdChevronRight } from "react-icons/md";
import { Navigate } from "react-router";

import ENDPOINT from "utilities/endpoint";
import { checkIsSignedIn } from "utilities/utility";
import {
    setIsSignedIn, useIsSignedIn 
} from "utilities/globalState";

import Layout from "components/Layout";

import "./index.scss";

function LoginPage() {
    const passwordInputRef = createRef();
    const [isSignedIn] = useIsSignedIn();

    useEffect(() => {
        async function fetchData() {
            setIsSignedIn(await checkIsSignedIn());
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (isSignedIn) {
            Navigate({ to: window.location.hostname === "localhost" ? "/" : "/app/hsse/" });
        }
    }, [isSignedIn]);

    return (
        <Layout
            className="login-page"
            title="Homestuck Search Engine | Login">
            <form id="login-form">
                <label htmlFor="password-field">Password:</label>
                <div className="themed-input-wrapper">
                    <input
                        className="themed-input"
                        id="password-field"
                        placeholder="Password"
                        type="password"
                        autoComplete="password"
                        ref={passwordInputRef}
                    />
                </div>

                <div className="button-wrapper">
                    <button
                        id="login-btn"
                        onClick={(e) => {
                            e.preventDefault();

                            fetch(`${ENDPOINT}/api/app/1/login`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ password: passwordInputRef.current.value })
                            })
                                .then((e) => e.json())
                                .then((data) => {
                                    // Reset field
                                    passwordInputRef.current.value = "";

                                    if (data.valid) {
                                        document.cookie = `hsse_token=${
                                            data.token
                                        }; expires=${new Date(data.expires)}`;

                                        setIsSignedIn(true);
                                    } else {
                                        // TODO: Error stuff
                                        console.error(data);
                                    }
                                });
                        }}
                    >
                        <MdChevronRight /> Sign In
                    </button>
                </div>
            </form>
        </Layout>
    );
}

export default LoginPage;
