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

const form = document.querySelector("#register-form");
const noticeRegion = document.querySelector("#register-notice");
const submitButton = document.querySelector("#register-submit");

async function init() {
    const user = await getActiveUser();
    mountChrome({ active: "register", user });
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
        submitButton.textContent = "Creating account...";

        try {
            const response = await apiRequest(
                "/users/register",
                {
                    method: "POST",
                    body: JSON.stringify(payload),
                },
                { auth: false },
            );

            const data = response?.data || response;
            setSession({ accessToken: data.accessToken, user: data.user });
            setFlash(
                "Account created. Please verify yourself before booking.",
                "warning",
            );
            goProfile("verify");
        } catch (error) {
            if (noticeRegion) {
                noticeRegion.innerHTML = `<div class="notice danger">${error.message}</div>`;
            }
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Create account";
        }
    });
}

clearSession();
init();
