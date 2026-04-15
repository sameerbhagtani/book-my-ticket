import {
    apiRequest,
    clearSession,
    getActiveUser,
    getParam,
    goLogin,
    mountChrome,
    setFlash,
    showFlashFromStorage,
} from "./app.js";

const form = document.querySelector("#reset-form");
const noticeRegion = document.querySelector("#reset-notice");
const submitButton = document.querySelector("#reset-submit");
const token = getParam("token");

async function init() {
    const user = await getActiveUser();
    mountChrome({ active: "login", user });
    showFlashFromStorage(noticeRegion);

    if (!token) {
        if (noticeRegion) {
            noticeRegion.innerHTML = `<div class="notice danger">Reset token is missing.</div>`;
        }
        return;
    }

    form?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const password = String(new FormData(form).get("password") || "");
        submitButton.disabled = true;
        submitButton.textContent = "Resetting...";

        try {
            await apiRequest(
                "/users/reset-password",
                {
                    method: "POST",
                    body: JSON.stringify({ token, password }),
                },
                { auth: false },
            );

            try {
                await apiRequest("/users/logout", { method: "POST" });
            } catch {
                // Ignore logout issues here.
            }

            clearSession();
            setFlash("Password updated. Please login again.", "success");
            goLogin("/");
        } catch (error) {
            if (noticeRegion) {
                noticeRegion.innerHTML = `<div class="notice danger">${error.message}</div>`;
            }
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Reset password";
        }
    });
}

init();
