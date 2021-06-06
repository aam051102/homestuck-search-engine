import ENDPOINT from "utilities/endpoint";
import { setDialog } from "utilities/globalState";

/**
 * Gets a cookie by name
 * @param {*} name The name of the cookie to find
 * @returns {string | undefined}
 */
export function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
        return parts.pop().split(";").shift();
    }

    return undefined;
}

/**
 * Checks whether or not the user is currently signed in with a valid token
 * @returns {Promise<boolean>}
 */
export async function checkIsSignedIn() {
    let cookieData = getCookie("hsse_token");

    return new Promise((resolve) => {
        if (cookieData) {
            return fetch(`${ENDPOINT}/api/app/1/validate`, {
                method: "POST",
                headers: { Authorization: `Bearer ${cookieData}` }
            }).then((e) => {
                if (e.status === 200) {
                    resolve(true);
                    return true;
                } else {
                    resolve(false);
                    return false;
                }
            });
        } else {
            resolve(false);
            return false;
        }
    });
}

/**
 * Shows warning of outdated session.
 */
export function showOutdatedSessionDialog() {
    setDialog({
        visible: true, title: "Login Session Outdated", content: "Login expired. Please sign back in. You may do this in another tab." 
    });
}

/**
 * Whether or not edits have been made.
 */
export let isEdited = false;

/**
 * Sets isEdited.
 * @param {boolean} value 
 */
export function setIsEdited(value) {
    isEdited = value;
}

/**
 * Focuses on an element.
 * @param {HTMLElement} el 
 */
export function focusElement(el) {
    el.focus();
    el.selectionStart = el.selectionEnd = el.value.length;
}