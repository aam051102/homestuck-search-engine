import { atom } from "recoil";
import { IResult } from "types";

/**
 * Contains result information
 */
export const resultsState = atom<IResult[]>({ key: "results", default: [] });

/**
 * Whether or not user is in editing mode
 */
export const isEditingState = atom<boolean>({
    key: "isEditing",
    default: false,
});

/**
 * Whether or not user is signed in
 */
export const isSignedInState = atom<boolean>({
    key: "isSignedIn",
    default: false,
});
