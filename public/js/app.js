const ACCESS_TOKEN_KEY = "bmt_access_token";
const USER_KEY = "bmt_user";
const FLASH_KEY = "bmt_flash";

function safeStorage() {
    try {
        return sessionStorage;
    } catch {
        return null;
    }
}

function readStorage(key) {
    const storage = safeStorage();
    return storage ? storage.getItem(key) : null;
}

function writeStorage(key, value) {
    const storage = safeStorage();
    if (storage) {
        storage.setItem(key, value);
    }
}

function removeStorage(key) {
    const storage = safeStorage();
    if (storage) {
        storage.removeItem(key);
    }
}

function decodeBase64Url(input) {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
        normalized.length + ((4 - (normalized.length % 4)) % 4),
        "=",
    );
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) =>
        character.charCodeAt(0),
    );
    return new TextDecoder().decode(bytes);
}

export function decodeJwtPayload(token) {
    try {
        const part = token.split(".")[1];
        if (!part) {
            return null;
        }
        return JSON.parse(decodeBase64Url(part));
    } catch {
        return null;
    }
}

export function getAccessToken() {
    return readStorage(ACCESS_TOKEN_KEY);
}

export function getCurrentUser() {
    const rawUser = readStorage(USER_KEY);
    if (!rawUser) {
        return null;
    }

    try {
        return JSON.parse(rawUser);
    } catch {
        return null;
    }
}

export function setSession({ accessToken, user }) {
    if (accessToken) {
        writeStorage(ACCESS_TOKEN_KEY, accessToken);
    }

    if (user) {
        writeStorage(USER_KEY, JSON.stringify(user));
    }
}

export function clearSession() {
    removeStorage(ACCESS_TOKEN_KEY);
    removeStorage(USER_KEY);
}

export function setFlash(message, tone = "info") {
    writeStorage(FLASH_KEY, JSON.stringify({ message, tone }));
}

export function consumeFlash() {
    const raw = readStorage(FLASH_KEY);
    removeStorage(FLASH_KEY);

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

export function buildUrl(path, params = {}) {
    const url = new URL(path, window.location.origin);
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, value);
        }
    }
    return `${url.pathname}${url.search}`;
}

export function go(path) {
    window.location.assign(path);
}

export function goHome() {
    go("/");
}

export function goLogin(
    nextPath = window.location.pathname + window.location.search,
) {
    go(buildUrl("/login.html", { next: nextPath }));
}

export function goProfile(notice = "") {
    go(buildUrl("/profile.html", { notice }));
}

export function goForbidden() {
    go("/403.html");
}

const INDIA_TIME_ZONE = "Asia/Kolkata";
const INDIA_TIME_ZONE_OFFSET_MINUTES = 330;

export function parseISTDateTimeLocal(value) {
    if (!value) {
        return null;
    }

    const match = String(value).match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
    );

    if (!match) {
        return null;
    }

    const [
        ,
        yearText,
        monthText,
        dayText,
        hourText,
        minuteText,
        secondText = "0",
    ] = match;

    const timestamp =
        Date.UTC(
            Number(yearText),
            Number(monthText) - 1,
            Number(dayText),
            Number(hourText),
            Number(minuteText),
            Number(secondText),
        ) -
        INDIA_TIME_ZONE_OFFSET_MINUTES * 60 * 1000;

    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatShortDate(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    return new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        timeZone: INDIA_TIME_ZONE,
    }).format(date);
}

export function formatTimeRange(startTime, endTime) {
    if (!startTime || !endTime) {
        return "";
    }

    const formatter = new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        timeZone: INDIA_TIME_ZONE,
    });

    return `${formatter.format(new Date(startTime))} - ${formatter.format(new Date(endTime))}`;
}

function buildRequestHeaders(options = {}) {
    const headers = new Headers(options.headers || {});
    const shouldAttachJson =
        options.body &&
        !(options.body instanceof FormData) &&
        !(options.body instanceof URLSearchParams) &&
        !(options.body instanceof Blob) &&
        !headers.has("Content-Type");

    if (shouldAttachJson) {
        headers.set("Content-Type", "application/json");
    }

    return headers;
}

async function parseResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return response.json();
    }
    return response.text();
}

async function refreshAccessToken() {
    const response = await fetch("/api/users/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        return null;
    }

    const payload = await parseResponse(response);
    const accessToken =
        payload?.data?.accessToken || payload?.accessToken || null;

    if (!accessToken) {
        return null;
    }

    const user = decodeJwtPayload(accessToken);
    setSession({ accessToken, user });
    return accessToken;
}

export async function getActiveUser() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        return currentUser;
    }

    const refreshedToken = await refreshAccessToken();
    if (!refreshedToken) {
        return null;
    }

    return getCurrentUser();
}

export async function apiRequest(path, options = {}, config = {}) {
    const { retry = true, auth = true } = config;
    const headers = buildRequestHeaders(options);
    const method = options.method || "GET";
    const body =
        options.body &&
        typeof options.body === "object" &&
        !(options.body instanceof FormData) &&
        !(options.body instanceof URLSearchParams) &&
        !(options.body instanceof Blob)
            ? JSON.stringify(options.body)
            : options.body;

    if (auth) {
        const token = getAccessToken();
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
    }

    const response = await fetch(
        path.startsWith("/api") ? path : `/api${path}`,
        {
            ...options,
            method,
            body,
            headers,
            credentials: "include",
        },
    );

    if (
        response.status === 401 &&
        retry &&
        auth &&
        !path.includes("/users/refresh")
    ) {
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) {
            headers.set("Authorization", `Bearer ${refreshedToken}`);
            const retryResponse = await fetch(
                path.startsWith("/api") ? path : `/api${path}`,
                {
                    ...options,
                    method,
                    body,
                    headers,
                    credentials: "include",
                },
            );

            const retryPayload = await parseResponse(retryResponse);
            if (!retryResponse.ok) {
                const errorMessage =
                    retryPayload?.message ||
                    retryPayload?.error ||
                    `Request failed with status ${retryResponse.status}`;
                const error = new Error(errorMessage);
                error.status = retryResponse.status;
                error.payload = retryPayload;
                throw error;
            }

            return retryPayload;
        }

        clearSession();
    }

    const payload = await parseResponse(response);

    if (!response.ok) {
        const errorMessage =
            payload?.message ||
            payload?.error ||
            `Request failed with status ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.payload = payload;
        throw error;
    }

    return payload;
}

export async function ensureAuthenticated({
    requireVerified = false,
    allowAdminOnly = false,
} = {}) {
    const user = await getActiveUser();
    if (!user) {
        setFlash("Please log in to continue.", "warning");
        goLogin();
        return null;
    }

    if (allowAdminOnly && !user.isAdmin) {
        goForbidden();
        return null;
    }

    if (requireVerified && !user.isVerified) {
        setFlash("Please verify your account first.", "warning");
        goProfile("verify");
        return null;
    }

    return user;
}

export function mountChrome({ active = "home", user = getCurrentUser() } = {}) {
    const header = document.querySelector("#site-header");
    const footer = document.querySelector("#site-footer");

    if (header) {
        header.innerHTML = `
            <a class="brand" href="/">
                <img class="brand-mark" src="/favicon.png" alt="Book My Ticket logo" />
                <span>
                    Book My Ticket
                    <small style="display:block;color:var(--muted);font-weight:500;letter-spacing:0;">Simple seat booking</small>
                </span>
            </a>
            <nav class="topnav" aria-label="Primary">
                <a class="btn ${active === "home" ? "btn-primary" : "btn-secondary"}" href="/">Home</a>
                ${user ? `<a class="btn ${active === "profile" ? "btn-primary" : "btn-secondary"}" href="/profile.html">Profile</a>` : ""}
                ${!user ? `<a class="btn ${active === "login" ? "btn-primary" : "btn-secondary"}" href="/login.html">Login</a>` : ""}
                ${!user ? `<a class="btn ${active === "register" ? "btn-primary" : "btn-secondary"}" href="/register.html">Register</a>` : ""}
                ${user?.isAdmin ? `<a class="btn ${active === "create-show" ? "btn-primary" : "btn-secondary"}" href="/create-show.html">Create show</a>` : ""}
            </nav>
        `;
    }

    if (footer) {
        footer.textContent = "Book My Ticket";
    }
}

export function showFlashFromStorage(container) {
    const flash = consumeFlash();
    if (!flash || !container) {
        return;
    }

    container.innerHTML = `<div class="notice ${flash.tone || "info"}">${flash.message}</div>`;
}
