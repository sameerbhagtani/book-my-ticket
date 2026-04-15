import {
    apiRequest,
    clearSession,
    getActiveUser,
    goLogin,
    mountChrome,
    showFlashFromStorage,
} from "./app.js";

const form = document.querySelector("#forgot-form");
const noticeRegion = document.querySelector("#forgot-notice");
const submitButton = document.querySelector("#forgot-submit");

async function init() {
    const user = await getActiveUser();
    mountChrome({ active: "login", user });
    showFlashFromStorage(noticeRegion);

    form?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = String(new FormData(form).get("email") || "").trim();
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";

        try {
            await apiRequest(
                "/users/forgot-password",
                {
                    method: "POST",
                    body: JSON.stringify({ email }),
                },
                { auth: false },
            );

            if (noticeRegion) {
                noticeRegion.innerHTML = `
                    <div class="notice success">
                        If the email exists, a reset link has been sent.
                    </div>
                `;
            }
            form.reset();
        } catch (error) {
            if (noticeRegion) {
                noticeRegion.innerHTML = `<div class="notice danger">${error.message}</div>`;
            }
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Send reset link";
        }
    });
}

clearSession();
init();
