import {
    act,
    render, screen, waitFor 
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import Lightbox from "./";
import {
    setIsEditMode, setIsSignedIn, setResults 
} from "utilities/globalState";

/// Tests
// Search bar
describe("search bar", () => {
    test("correctly renders tags", async () => {
        // Set results
        act(() => {
            setResults([{
                "_id": 0,
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
            }]);
        });

        // Render
        render(<Lightbox
            id={0}
            visible={true}
        />);

        // Set expected tags
        const usedTags = [
            "part 1",
            "act 1",
            "sprite mode",
            "john's house",
            "john's room",
            "john",
            "animated"
        ];

        // Check if rendered tags match expected tags
        await waitFor(() => {
            const usedTagItemAll_DOM = screen.getAllByTestId(/lightbox-tag-item/i);

            for (let i = 0; i < usedTagItemAll_DOM.length; i++) {
                expect(usedTagItemAll_DOM[i]).toHaveTextContent(usedTags[i]);
            }
        });
    });

    test("correctly edits tags", async () => {
        // Set results
        act(() => {
            setResults([{
                "_id": 0,
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
            }]);
        });

        // Render
        render(<Lightbox
            id={0}
            visible={true}
        />);

        // Enable edit mode
        act(() => {
            setIsSignedIn(true);
            setIsEditMode(true);
        });

        // Find lightbox-tag-input fields after edit mode is enabled
        let lightboxTagInput_DOM;
        await waitFor(() => {
            lightboxTagInput_DOM = screen.queryAllByTestId(/lightbox-tag-input/i);
            expect(lightboxTagInput_DOM).not.toBeNull();
        });

        const firstInput_DOM = lightboxTagInput_DOM[0];

        // Edit the first tag
        userEvent.type(firstInput_DOM, "{backspace}edited");
        expect(firstInput_DOM).toHaveValue("part edited");

        // Select and replace entire first tag
        userEvent.type(firstInput_DOM, "{selectall}replaced");
        expect(firstInput_DOM).toHaveValue("replaced");
    });
});
