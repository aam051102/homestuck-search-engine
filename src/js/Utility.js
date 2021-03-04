import ENDPOINT from "./Endpoint";

export default async function checkSignedIn() {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${"hsse_token"}=`);

    let cookieData;

    if (parts.length === 2) {
        cookieData = parts.pop().split(";").shift();
    }

    return new Promise((resolve, reject) => {
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
