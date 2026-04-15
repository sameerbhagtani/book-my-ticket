import {
    apiRequest,
    clearSession,
    ensureAuthenticated,
    getParam,
    goHome,
    mountChrome,
    setFlash,
    showFlashFromStorage,
} from "./app.js";

const profileNotice = document.querySelector("#profile-notice");
const profileDetails = document.querySelector("#profile-details");
const resendButton = document.querySelector("#resend-verification");
const logoutButton = document.querySelector("#profile-logout");

async function init() {
    const user = await ensureAuthenticated();
    if (!user) {
        return;
    }

    mountChrome({ active: "profile", user });
    showFlashFromStorage(profileNotice);

    const notice = getParam("notice");
    if (notice === "verify" && profileNotice) {
        profileNotice.innerHTML = `
            <div class="notice warning">
                <strong>Please verify yourself first.</strong>
                <span>You can resend the verification link from here.</span>
            </div>
        `;
    }

    if (profileDetails) {
        profileDetails.innerHTML = `
            <div class="profile-item">
                <span>Name</span>
                <strong>${user.name}</strong>
            </div>
            <div class="profile-item">
                <span>Email</span>
                <strong>${user.email}</strong>
            </div>
            <div class="profile-item">
                <span>Status</span>
                <strong class="status-chip">${user.isVerified ? "Verified" : "Not verified"}</strong>
            </div>
        `;
    }

    if (resendButton) {
        if (user.isVerified) {
            resendButton.remove();
        } else {
            resendButton.addEventListener("click", async () => {
                resendButton.disabled = true;
                resendButton.textContent = "Sending...";

                try {
                    await apiRequest("/users/resend-verification", {
                        method: "POST",
                    });
                    if (profileNotice) {
                        profileNotice.innerHTML = `
                            <div class="notice success">
                                Verification link sent again. Please check your email.
                            </div>
                        `;
                    }
                } catch (error) {
                    if (profileNotice) {
                        profileNotice.innerHTML = `<div class="notice danger">${error.message}</div>`;
                    }
                } finally {
                    resendButton.disabled = false;
                    resendButton.textContent = "Resend verification link";
                }
            });
        }
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                await apiRequest("/users/logout", { method: "POST" });
            } catch {
                // Ignore.
            }

            clearSession();
            setFlash("Logged out successfully.", "info");
            goHome();
        });
    }
}

init();
