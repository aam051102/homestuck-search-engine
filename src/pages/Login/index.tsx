import React, { useEffect, useRef } from "react";
import { MdChevronRight } from "react-icons/md";
import { useNavigate } from "react-router";
import ENDPOINT, { BASE_URL } from "helpers/endpoint";
import { checkIsSignedIn } from "helpers/utility";
import Layout from "components/Layout";
import "./index.scss";
import { isSignedInState } from "helpers/globalState";
import { useRecoilState } from "recoil";

function LoginPage() {
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const [isSignedIn, setIsSignedIn] = useRecoilState(isSignedInState);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            const thisIsSignedIn = isSignedIn || (await checkIsSignedIn());

            if (thisIsSignedIn !== isSignedIn) {
                setIsSignedIn(thisIsSignedIn);
            }

            if (thisIsSignedIn) {
                navigate(BASE_URL);
            }
        })();
    }, [isSignedIn, setIsSignedIn, navigate]);

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
