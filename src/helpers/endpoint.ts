const ENDPOINT =
    window.location.hostname === "localhost"
        ? "http://localhost:4000"
        : "https://ahlgreen.net";

const BASE_URL = window.location.hostname === "localhost" ? "/" : "/app/hsse/";

export { BASE_URL };
export default ENDPOINT;
