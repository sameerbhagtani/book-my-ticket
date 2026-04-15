import {
    apiRequest,
    clearSession,
    getActiveUser,
    go,
    goHome,
    goProfile,
    mountChrome,
    setFlash,
    setSession,
    showFlashFromStorage,
} from "./app.js";

const form = document.querySelector("#login-form");
const noticeRegion = document.querySelector("#login-notice");
const submitButton = document.querySelector("#login-submit");

function safeNextPath() {
    const next = new URLSearchParams(window.location.search).get("next");
    if (!next || !next.startsWith("/")) {
        return "/";
    }

    if (next.startsWith("/login.html") || next.startsWith("/register.html")) {
        return "/";
    }

    return next;
}

async function init() {
    const user = await getActiveUser();
    mountChrome({ active: "login", user });
    showFlashFromStorage(noticeRegion);

    if (user) {
        if (user.isVerified) {
            goHome();
        } else {
            goProfile("verify");
        }
        return;
    }

    form?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());

        submitButton.disabled = true;
        submitButton.textContent = "Signing in...";

        try {
            const response = await apiRequest(
                "/users/login",
                {
                    method: "POST",
                    body: JSON.stringify(payload),
                },
                { auth: false },
            );

            const data = response?.data || response;
            setSession({ accessToken: data.accessToken, user: data.user });

            if (!data.user.isVerified) {
                setFlash(
                    "Please verify yourself before booking seats.",
                    "warning",
                );
                goProfile("verify");
                return;
            }

            go(safeNextPath());
        } catch (error) {
            if (noticeRegion) {
                noticeRegion.innerHTML = `<div class="notice danger">${error.message}</div>`;
            }
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Login";
        }
    });
}

clearSession();
init();
