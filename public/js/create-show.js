import {
    apiRequest,
    ensureAuthenticated,
    goForbidden,
    mountChrome,
    parseISTDateTimeLocal,
    showFlashFromStorage,
} from "./app.js";

const noticeRegion = document.querySelector("#admin-notice");
const form = document.querySelector("#create-show-form");
const screenSelect = document.querySelector("#screen-id");
const submitButton = document.querySelector("#create-show-submit");

async function loadScreens() {
    const response = await apiRequest("/screens", {}, { auth: false });
    const screens = response?.data?.screens || [];

    if (!screenSelect) {
        return;
    }

    if (!screens.length) {
        screenSelect.innerHTML = `<option value="">No screens available</option>`;
        screenSelect.disabled = true;
        return;
    }

    screenSelect.innerHTML = `
        <option value="">Select screen</option>
        ${screens
            .map(
                (screen) =>
                    `<option value="${screen.id}">${screen.name}</option>`,
            )
            .join("")}
    `;
}

async function init() {
    const user = await ensureAuthenticated();
    if (!user) {
        return;
    }

    if (!user.isAdmin) {
        goForbidden();
        return;
    }

    mountChrome({ active: "create-show", user });
    showFlashFromStorage(noticeRegion);

    try {
        await loadScreens();
    } catch (error) {
        if (noticeRegion) {
            noticeRegion.innerHTML = `<div class="notice danger">${error.message}</div>`;
        }
    }

    form?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const payload = {
            screenId: Number(formData.get("screenId")),
            movieTitle: String(formData.get("movieTitle") || "").trim(),
            startTime: String(formData.get("startTime") || ""),
            endTime: String(formData.get("endTime") || ""),
        };

        if (!payload.screenId || Number.isNaN(payload.screenId)) {
            if (noticeRegion) {
                noticeRegion.innerHTML = `<div class="notice warning">Please select a screen.</div>`;
            }
            return;
        }

        if (!payload.movieTitle) {
            if (noticeRegion) {
                noticeRegion.innerHTML = `<div class="notice warning">Movie title is required.</div>`;
            }
            return;
        }

        const startTime = parseISTDateTimeLocal(payload.startTime);
        const endTime = parseISTDateTimeLocal(payload.endTime);

        if (!startTime || !endTime) {
            if (noticeRegion) {
                noticeRegion.innerHTML = `<div class="notice warning">Please set valid start and end time values.</div>`;
            }
            return;
        }

        if (endTime <= startTime) {
            if (noticeRegion) {
                noticeRegion.innerHTML = `<div class="notice warning">End time must be later than start time.</div>`;
            }
            return;
        }

        payload.startTime = startTime.toISOString();
        payload.endTime = endTime.toISOString();

        submitButton.disabled = true;
        submitButton.textContent = "Creating...";

        try {
            await apiRequest("/shows", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (noticeRegion) {
                noticeRegion.innerHTML = `<div class="notice success">Show created successfully.</div>`;
            }
            form.reset();
        } catch (error) {
            if (noticeRegion) {
                noticeRegion.innerHTML = `<div class="notice danger">${error.message}</div>`;
            }
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Create show";
        }
    });
}

init();
