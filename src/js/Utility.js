import ENDPOINT from "./endpoint";
import { setDialog } from "./globalState";

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
            return fetch(`${ENDPOINT}/api/validate`, {
                method: "POST",
                headers: { Authorization: `Bearer ${cookieData}`, },
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
    setDialog({ visible: true, title: "Login Session Outdated", content: "Login expired. Please sign back in. You may do this in another tab.", });
}

/**
 * Saves edited data.
 */
export async function saveData() {
    if (!getCookie("hsse_token")) {
        showOutdatedSessionDialog();
        return;
    }

    // TODO: Move individual edits to global editing system.
    /*
    const tags = [];

    document.querySelectorAll(".tag-input").forEach((tag) => {
        tags.push(tag.value);
    });
    
    return await fetch(`${ENDPOINT}/api/app/1/edit/${result._id}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getCookie("hsse_token")}`,
        },
        body: JSON.stringify({ tags: tags, }),
    }).then(e => {
        if (e.status === 403 || e.status === 401) {
            showOutdatedSessionDialog();
            return { error: "Session outdated.", };
        } else {
            return e.json();
        }
    }).then((res) => {
        if (res.error) {
            console.error(res.error);
        } else {
            result.tags = tags.slice();
            setResultTags(tags);
        }
    });
    */
}