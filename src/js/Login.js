import React, { createRef } from "react";
import { MdChevronRight } from "react-icons/md";

import "../css/Login.scss";

import ENDPOINT from "./Endpoint";
import Layout from "./Layout";

function LoginPage() {
    const passwordInputRef = createRef();

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
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    password: passwordInputRef.current.value,
                                }),
                            })
                                .then((e) => e.json())
                                .then((data) => {
                                    if (data.valid) {
                                        document.cookie = `hsse_token=${
                                            data.token
                                        }; expires=${new Date(data.expires)}`;
                                    } else {
                                        // TODO: Error stuff
                                    }

                                    // Reset field
                                    passwordInputRef.current.value = "";
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
