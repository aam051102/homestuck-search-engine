import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import Controls from ".";
import { setIsSignedIn } from "helpers/globalState";

/// Tests
// Controls
describe("controls", () => {
    test("render correctly", async () => {
        render(
            <div data-testid="test-wrapper">
                <Controls />
            </div>
        );

        // Check that edit button does not exist when not signed in
        expect(
            screen.queryByTestId("controls-edit-btn")
        ).not.toBeInTheDocument();

        // Check that edit button does exist when signed in
        act(() => {
            setIsSignedIn(true);
        });

        expect(screen.queryByTestId("controls-edit-btn")).toBeInTheDocument();

        // Check that cancel icon and save button do not exist when not in edit mode
        expect(
            screen.queryByTestId("controls-cancel-icon")
        ).not.toBeInTheDocument();
        expect(
            screen.queryByTestId("controls-save-btn")
        ).not.toBeInTheDocument();

        // Check that cancel icon and save button do exist when in edit mode
        userEvent.type(screen.getByTestId("test-wrapper"), "e");

        expect(screen.queryByTestId("controls-save-btn")).toBeInTheDocument();
        expect(
            screen.queryByTestId("controls-cancel-icon")
        ).toBeInTheDocument();
    });
});
