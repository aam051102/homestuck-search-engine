import React, { useEffect, useRef } from "react";
import { MdChevronRight } from "react-icons/md";
import { useNavigate } from "react-router";

import ENDPOINT from "helpers/endpoint";
import { checkIsSignedIn } from "helpers/utility";
import { setIsSignedIn, useIsSignedIn } from "helpers/globalState";

import Layout from "components/Layout";

import "./index.scss";

function LoginPage() {
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const [isSignedIn] = useIsSignedIn();
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchData() {
            setIsSignedIn(await checkIsSignedIn());
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (isSignedIn) {
            navigate(
                window.location.hostname === "localhost" ? "/" : "/app/hsse/"
            );
        }
    }, [isSignedIn]);

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

                            if (passwordInputRef.current) {
                                fetch(`${ENDPOINT}/api/app/1/login`, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        password:
                                            passwordInputRef.current.value,
                                    }),
                                })
                                    .then((e) => e.json())
                                    .then((data) => {
                                        // Reset field
                                        if (passwordInputRef.current)
                                            passwordInputRef.current.value = "";

                                        if (data.valid) {
                                            document.cookie = `hsse_token=${
                                                data.token
                                            }; expires=${new Date(
                                                data.expires
                                            )}`;

                                            setIsSignedIn(true);
                                        } else {
                                            // TODO: Error stuff
                                            console.error(data);
                                        }
                                    });
                            }
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
