import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "./serviceWorker";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Home from "pages/Home";
const Login = lazy(() => import("pages/Login"));
const Tags = lazy(() => import("pages/Tags"));

import "./index.scss";

const BASE = window.location.hostname === "localhost" ? "" : "/app/hsse";

ReactDOM.render(
    <React.StrictMode>
        <Suspense fallback={<div>Loading...</div>}>
            <HelmetProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path={`${BASE}/`} element={<Home />} />
                        <Route path={`${BASE}/tags`} element={<Tags />} />
                        <Route path={`${BASE}/login`} element={<Login />} />
                    </Routes>
                </BrowserRouter>
            </HelmetProvider>
        </Suspense>
    </React.StrictMode>,
    document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
