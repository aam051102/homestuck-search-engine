import createGlobalState from "global-react-state";
import { IResult } from "types";

/**
 * Contains result information
 */
export const [useResults, setResults] = createGlobalState<IResult[]>([]);

/**
 * Whether or not user is in edit mode
 */
export const [useIsEditMode, setIsEditMode] = createGlobalState<boolean>(false);

/**
 * Whether or not user is signed in
 */
export const [useIsSignedIn, setIsSignedIn] = createGlobalState<boolean>(false);

/**
 * Dialog information
 */
export const [useDialog, setDialog] = createGlobalState<{
    title?: React.ReactNode;
    content?: React.ReactNode;
    visible: boolean;
    buttons?: { title?: string; callbacks?: (() => void)[] }[];
}>({
    visible: false,
    title: "",
    content: "",
    buttons: [],
});
