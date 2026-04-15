import {
    apiRequest,
    formatTimeRange,
    formatShortDate,
    getActiveUser,
    go,
    goLogin,
    goProfile,
    mountChrome,
    showFlashFromStorage,
} from "./app.js";

const flashRegion = document.querySelector("#flash-region");
const showsGrid = document.querySelector("#shows-grid");

function bookingPath(showId) {
    return `/booking.html?showId=${encodeURIComponent(showId)}`;
}

async function goToBooking(showId) {
    const user = await getActiveUser();

    if (!user) {
        goLogin(bookingPath(showId));
        return;
    }

    if (!user.isVerified) {
        goProfile("verify");
        return;
    }

    go(bookingPath(showId));
}

function renderShows(shows, screenMap) {
    if (!showsGrid) {
        return;
    }

    if (!shows.length) {
        showsGrid.innerHTML = `
            <div class="empty-state card" style="grid-column:1 / -1;">
                <strong>No shows yet.</strong>
                <span>Once an admin creates shows, they will appear here.</span>
            </div>
        `;
        return;
    }

    showsGrid.innerHTML = shows
        .slice()
        .sort(
            (left, right) =>
                new Date(left.startTime) - new Date(right.startTime),
        )
        .map((show) => {
            const screenName =
                screenMap.get(show.screenId) || `Screen ${show.screenId}`;
            return `
                <article class="show-card">
                    <div class="show-meta">
                        <span class="badge">${screenName}</span>
                        <span class="badge muted">${formatShortDate(show.startTime)}</span>
                    </div>
                    <div>
                        <h3>${show.movieTitle}</h3>
                        <p>${formatTimeRange(show.startTime, show.endTime)}</p>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-primary" type="button" data-book-show="${show.id}">Book seats</button>
                    </div>
                </article>
            `;
        })
        .join("");

    showsGrid.querySelectorAll("[data-book-show]").forEach((button) => {
        button.addEventListener("click", async () => {
            const showId = button.getAttribute("data-book-show");
            button.disabled = true;
            button.textContent = "Opening...";
            await goToBooking(showId);
            button.disabled = false;
            button.textContent = "Book seats";
        });
    });
}

async function init() {
    const user = await getActiveUser();
    mountChrome({ active: "home", user });
    showFlashFromStorage(flashRegion);

    try {
        const [showsResponse, screensResponse] = await Promise.all([
            apiRequest("/shows", {}, { auth: false }),
            apiRequest("/screens", {}, { auth: false }),
        ]);

        const shows = showsResponse?.data?.shows || [];
        const screens = screensResponse?.data?.screens || [];
        const screenMap = new Map(
            screens.map((screen) => [screen.id, screen.name]),
        );
        renderShows(shows, screenMap);
    } catch (error) {
        if (showsGrid) {
            showsGrid.innerHTML = `
                <div class="error-state card" style="grid-column:1 / -1;">
                    <strong>Could not load shows.</strong>
                    <span>${error.message}</span>
                </div>
            `;
        }
    }
}

init();
