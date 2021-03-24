import createGlobalState from "global-react-state";

export const [useDialog, setDialog, ] = createGlobalState({ visible: false, title: "", content: "", });