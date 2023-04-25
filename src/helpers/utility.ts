import ENDPOINT from "helpers/endpoint";
import { setDialog } from "helpers/globalState";
import { setIsSignedIn } from "helpers/globalState";

function setCookie(params: {
    name: string;
    value: string;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
}) {
    const name = params.name;
    const value = params.value;
    const expireDays = params.days;
    const expireHours = params.hours;
    const expireMinutes = params.minutes;
    const expireSeconds = params.seconds;

    const expireDate = new Date();
    if (expireDays) {
        expireDate.setDate(expireDate.getDate() + expireDays);
    }
    if (expireHours) {
        expireDate.setHours(expireDate.getHours() + expireHours);
    }
    if (expireMinutes) {
        expireDate.setMinutes(expireDate.getMinutes() + expireMinutes);
    }
    if (expireSeconds) {
        expireDate.setSeconds(expireDate.getSeconds() + expireSeconds);
    }

    document.cookie =
        name +
        "=" +
        escape(value) +
        ";domain=" +
        window.location.hostname +
        ";path=/" +
        ";expires=" +
        expireDate.toUTCString();
}

function deleteCookie(name: string) {
    setCookie({ name: name, value: "", seconds: 1 });
}

/**
 * Gets a cookie by name
 * @param name The name of the cookie to find
 */
export function getCookie(name: string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
        return parts.pop()?.split(";").shift();
    }

    return undefined;
}

/**
 * Checks whether or not the user is currently signed in with a valid token
 */
export async function checkIsSignedIn() {
    const cookieData = getCookie("hsse_token");

    return new Promise<boolean>((resolve) => {
        if (cookieData) {
            return fetch(`${ENDPOINT}/api/app/1/validate`, {
                method: "POST",
                headers: { Authorization: `Bearer ${cookieData}` },
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
 * Signs the user out, removing their token
 */
export function signOut() {
    deleteCookie("hsse_token");
    setIsSignedIn(false);
}

/**
 * Shows warning of outdated session.
 */
export function showOutdatedSessionDialog() {
    setDialog({
        visible: true,
        title: "Login Session Outdated",
        content:
            "Login expired. Please sign back in. You may do this in another tab.",
    });
}

/**
 * Focuses on an element.
 * @param el
 */
export function focusElement(el?: HTMLInputElement | null) {
    if (el) {
        el.focus();
        el.selectionStart = el.selectionEnd = el.value.length;
    }
}
