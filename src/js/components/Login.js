import React, { createRef, useEffect } from "react";
import { MdChevronRight } from "react-icons/md";
import { navigate } from "@reach/router";

import ENDPOINT from "../endpoint";
import Layout from "./Layout";
import { checkIsSignedIn } from "../utility";
import { setIsSignedIn, useIsSignedIn } from "../globalState";

import "../../css/Login.scss";

function LoginPage() {
    const passwordInputRef = createRef();
    const [isSignedIn, ] = useIsSignedIn();

    useEffect(() => {
        async function fetchData() {
            setIsSignedIn(await checkIsSignedIn());
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (isSignedIn) {
            navigate(window.location.hostname === "localhost" ? 
                "/" :
                "/app/hsse/");
        }
    }, [isSignedIn, ]);

    return (
        <Layout className="login-page" title="Homestuck Search Engine | Login">
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
                                headers: { "Content-Type": "application/json", },
                                body: JSON.stringify({ password: passwordInputRef.current.value, }),
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
