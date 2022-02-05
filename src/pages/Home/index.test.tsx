import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { Suspense } from "react";
import { rest } from "msw";
import { setupServer } from "msw/node";

import ENDPOINT from "helpers/endpoint";

import HomePage from ".";
import { setResults } from "helpers/globalState";

/// Function mocking
const serverCall = jest.fn();

/// API Mocking
const server = setupServer(
    rest.post(`${ENDPOINT}/api/app/1/validate`, (req, res, ctx) => {
        return res(ctx.status(200));
    }),
    rest.get(`${ENDPOINT}/api/app/1/tags`, (req, res, ctx) => {
        return res(
            ctx.json([
                {
                    _id: "1",
                    category: "Characters",
                    tags: [
                        {
                            title: "john",
                            synonyms: ["john", "john egbert"],
                        },
                    ],
                },
                {
                    _id: "2",
                    category: "Characters",
                    tags: [
                        {
                            title: "dave",
                            synonyms: ["dave", "dave strider"],
                        },
                    ],
                },
                {
                    _id: "3",
                    category: "Characters",
                    tags: [
                        {
                            title: "dad egbert",
                            synonyms: [
                                "dad egbert",
                                "pre-scratch dad",
                                "beta dad",
                            ],
                        },
                    ],
                },
            ])
        );
    }),
    rest.post(`${ENDPOINT}/api/app/1/search`, (req, res, ctx) => {
        serverCall(req.body);

        return res(
            ctx.json([
                {
                    _id: "0",
                    type: 0,
                    content:
                        "https://www.homestuck.com/images/storyfiles/hs2/00001.gif",
                    thumbnail:
                        "https://www.homestuck.com/images/storyfiles/hs2/00001.gif",
                    tags: [
                        "part 1",
                        "act 1",
                        "sprite mode",
                        "john's house",
                        "john's room",
                        "john",
                        "animated",
                    ],
                    page: 1,
                },
            ])
        );
    })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

/// Tests
// Search bar
describe("search bar", () => {
    test("correctly processes search tags and ranges", async () => {
        render(
            <Suspense fallback="Suspense">
                <HomePage />
            </Suspense>
        );

        const searchField_DOM = screen.getByTestId(/search-field/i);
        const searchButton_DOM = screen.getByTestId(/search-button/i);

        // Wait for tags to load
        await waitFor(() =>
            expect(
                screen.queryAllByTestId(/tag-category-list/i)[0]
            ).toBeInTheDocument()
        );

        // Write tag and submit form
        userEvent.type(
            searchField_DOM,
            "(119-510), (631), John Egbert, dave,     BEta DAd   "
        );
        searchButton_DOM.click();

        // Wait for server call to check sent data
        await waitFor(() =>
            expect(serverCall).toHaveBeenLastCalledWith({
                ranges: [
                    ["119", "510"],
                    ["631", ""],
                ],
                tags: ["john", "dave", "dad egbert"],
            })
        );
    });

    test("correctly processes empty searches", async () => {
        render(
            <Suspense fallback="Suspense">
                <HomePage />
            </Suspense>
        );

        const searchButton_DOM = screen.getByTestId(/search-button/i);

        // Wait for tags to load
        await waitFor(() =>
            expect(
                screen.queryAllByTestId(/tag-category-list/i)[0]
            ).toBeInTheDocument()
        );

        // Write tag and submit form
        searchButton_DOM.click();

        // Wait for server call to check sent data
        await waitFor(() =>
            expect(serverCall).toHaveBeenLastCalledWith({
                ranges: [],
                tags: [],
            })
        );
    });

    test("correctly renders used tags", async () => {
        render(
            <Suspense fallback="Suspense">
                <HomePage />
            </Suspense>
        );

        // Set results
        act(() => {
            setResults([
                {
                    _id: 0,
                    type: 0,
                    content:
                        "https://www.homestuck.com/images/storyfiles/hs2/00001.gif",
                    thumbnail:
                        "https://www.homestuck.com/images/storyfiles/hs2/00001.gif",
                    tags: [5, 8],
                    page: 1,
                },
            ]);
        });

        // Check if used tags are correct
        const usedTags = [
            "part 1",
            "act 1",
            "sprite mode",
            "john's house",
            "john's room",
            "john",
            "animated",
        ];

        await waitFor(() => {
            const usedTagItemAll_DOM =
                screen.queryAllByTestId(/used-tag-item/i);

            for (let i = 0; i < usedTagItemAll_DOM.length; i++) {
                expect(usedTagItemAll_DOM[i]).toHaveTextContent(usedTags[i]);
            }
        });
    });
});
