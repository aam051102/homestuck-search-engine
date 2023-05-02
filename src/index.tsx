import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import * as serviceWorker from "./serviceWorker";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Home from "pages/Home";
import { RecoilRoot } from "recoil";
const Login = lazy(() => import("pages/Login"));
const Tags = lazy(() => import("pages/Tags"));

import "./index.scss";

const BASE = window.location.hostname === "localhost" ? "" : "/app/hsse";

const root = createRoot(document.getElementById("root") as HTMLElement);

root.render(
    <React.StrictMode>
        <Suspense
            fallback={
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "100vh",
                    }}
                >
                    Loading...
                </div>
            }
        >
            <RecoilRoot>
                <HelmetProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path={`${BASE}/`} element={<Home />} />
                            <Route path={`${BASE}/tags`} element={<Tags />} />
                            <Route path={`${BASE}/login`} element={<Login />} />
                        </Routes>
                    </BrowserRouter>
                </HelmetProvider>
            </RecoilRoot>
        </Suspense>
    </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
