import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "./serviceWorker";
import { Router } from "@reach/router";

import "./index.scss";

import Home from "./js/Home";
const Login = lazy(() => import("./js/Login"));
const Edit = lazy(() => import("./js/Edit"));
const Settings = lazy(() => import("./js/Settings"));

const ENDPOINT = window.location.host === "localhost:3000" ? "" : "/app/hsse";

ReactDOM.render(
    <React.StrictMode>
        <Suspense fallback={<div>Loading...</div>}>
            <Router>
                <Home path={`${ENDPOINT}/`} />
                <Login path={`${ENDPOINT}/login`} />
                <Edit path={`${ENDPOINT}/edit`} />
                <Settings path={`${ENDPOINT}/settings`} />
            </Router>
        </Suspense>
    </React.StrictMode>,
    document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();
