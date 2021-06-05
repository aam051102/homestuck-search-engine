import {
    render, screen, waitFor 
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { Suspense } from "react";
import { rest } from "msw";
import { setupServer } from "msw/node";

import ENDPOINT from "utilities/endpoint";

import HomePage from "./";

/// Function mocking
const serverCall = jest.fn();

/// API Mocking
const server = setupServer(
    rest.get(`${ENDPOINT}/api/app/1/tags`, (req, res, ctx) => {
        return res(ctx.json([{
            "_id": "1",
            "category": "Characters",
            "tags": [{
                "title": "john",
                "synonyms": ["john", "john egbert"]
            }]
        }]));
    }),
    rest.post(`${ENDPOINT}/api/app/1/search`, (req, res, ctx) => {
        serverCall(req.body);

        return res(ctx.json([{
            "_id": "0",
            "type": 0,
            "content": "https://www.homestuck.com/images/storyfiles/hs2/00001.gif",
            "thumbnail": "https://www.homestuck.com/images/storyfiles/hs2/00001.gif",
            "tags": [
                "part 1",
                "act 1",
                "sprite mode",
                "john's house",
                "john's room",
                "john",
                "animated"
            ],
            "page": 1 
        }]));
    })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

/// Tests
// Search bar
describe("search bar", () => {
    test("correctly processes search tags", async () => {
        render(<Suspense fallback="Suspense"><HomePage /></Suspense>);
        
        const searchField_DOM = screen.getByTestId(/search-field/i);
        const searchButton_DOM = screen.getByTestId(/search-button/i);

        // Wait for tags to load
        await waitFor(() => expect(screen.getByTestId(/tag-category-list/i)).toBeInTheDocument());

        // Write tag and submit form
        userEvent.type(searchField_DOM, "John Egbert");
        searchButton_DOM.click();

        // Wait for server call to check sent data
        await waitFor(() => expect(serverCall).toHaveBeenLastCalledWith({
            ranges: [],
            tags: ["john"] 
        }));
    });
});
