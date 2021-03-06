import ENDPOINT from "./Endpoint";

export function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
        return parts.pop().split(";").shift();
    }

    return undefined;
}

export async function checkSignedIn() {
    let cookieData = getCookie("hsse_token");

    return new Promise((resolve) => {
        if (cookieData) {
            return fetch(`${ENDPOINT}/api/validate`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${cookieData}`,
                },
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
