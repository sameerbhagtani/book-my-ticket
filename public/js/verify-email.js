import {
    apiRequest,
    decodeJwtPayload,
    getActiveUser,
    getParam,
    goHome,
    mountChrome,
    setFlash,
    setSession,
    showFlashFromStorage,
} from "./app.js";

const noticeRegion = document.querySelector("#verify-notice");
const stateRegion = document.querySelector("#verify-state");
const token = getParam("token");

function renderState(message, tone = "info") {
    if (stateRegion) {
        stateRegion.innerHTML = `<div class="notice ${tone}">${message}</div>`;
    }
}

async function init() {
    const user = await getActiveUser();
    mountChrome({ active: "login", user });
    showFlashFromStorage(noticeRegion);

    if (!token) {
        renderState("Verification token is missing.", "danger");
        return;
    }

    if (!user) {
        renderState(
            "Please sign in first so we can verify your account.",
            "warning",
        );
        return;
    }

    if (user.isVerified) {
        renderState("Your account is already verified.", "success");
        return;
    }

    renderState("Verifying your account...", "info");

    try {
        await apiRequest(
            `/users/verify-email?token=${encodeURIComponent(token)}`,
            {
                method: "POST",
            },
        );

        const refreshResponse = await apiRequest(
            "/users/refresh",
            { method: "POST" },
            { auth: false },
        );

        const refreshedToken =
            refreshResponse?.data?.accessToken || refreshResponse?.accessToken;

        if (!refreshedToken) {
            renderState(
                "Verification succeeded, but session refresh failed.",
                "warning",
            );
            return;
        }

        setSession({
            accessToken: refreshedToken,
            user: decodeJwtPayload(refreshedToken),
        });

        setFlash("Your email has been verified. You can book now.", "success");
        goHome();
    } catch (error) {
        renderState(error.message, "danger");
    }
}

init();
