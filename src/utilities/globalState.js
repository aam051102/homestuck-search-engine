import createGlobalState from "global-react-state";

/**
 * Contains result information
 */
export const [useResults, setResults, ] = createGlobalState([]);

/**
 * Contains editing information
 */
export const [useEdits, setEdits, ] = createGlobalState({});

/**
 * Whether or not user is in edit mode
 */
export const [useIsEditMode, setIsEditMode, ] = createGlobalState(false);

/**
 * Whether or not user is signed in
 */
export const [useIsSignedIn, setIsSignedIn, ] = createGlobalState(false);

/**
 * Dialog information
 */
export const [useDialog, setDialog, ] = createGlobalState({ visible: false, title: "", content: "", });