import {
    apiRequest,
    ensureAuthenticated,
    getParam,
    goHome,
    goLogin,
    goProfile,
    mountChrome,
    setFlash,
    showFlashFromStorage,
} from "./app.js";

const bookingNotice = document.querySelector("#booking-notice");
const bookingSummary = document.querySelector("#booking-summary");
const seatsRegion = document.querySelector("#seats-region");

const showId = Number(getParam("showId"));

function formatScheduleRange(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const datePart = new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Kolkata",
    }).format(start);

    const timePart = new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
    });

    return `${datePart}, ${timePart.format(start)} - ${timePart.format(end)}`;
}

function renderError(message) {
    if (bookingSummary) {
        bookingSummary.innerHTML = `<div class="notice danger">${message}</div>`;
    }

    if (seatsRegion) {
        seatsRegion.innerHTML = `
            <div class="empty-state card" style="grid-column:1 / -1;">
                <strong>Unable to load seats.</strong>
                <span>${message}</span>
                <a class="btn btn-secondary" href="/">Back home</a>
            </div>
        `;
    }
}

async function loadShowDetails() {
    const [showsResponse, screensResponse, seatsResponse] = await Promise.all([
        apiRequest("/shows", {}, { auth: false }),
        apiRequest("/screens", {}, { auth: false }),
        apiRequest(`/shows/${showId}/seats`, {}, { auth: false }),
    ]);

    const shows = showsResponse?.data?.shows || [];
    const screens = screensResponse?.data?.screens || [];
    const seats = seatsResponse?.data?.seats || [];
    const show = shows.find((item) => Number(item.id) === showId);
    const screenName =
        screens.find((screen) => Number(screen.id) === Number(show?.screenId))
            ?.name || `Screen ${show?.screenId || ""}`;

    const scheduleRange = formatScheduleRange(show?.startTime, show?.endTime);

    if (!show) {
        goHome();
        return;
    }

    if (bookingSummary) {
        bookingSummary.innerHTML = `
            <div class="stack">
                <div class="summary-actions">
                    <a class="btn btn-secondary" href="/">Back home</a>
                </div>
                <div class="summary-row">
                    <span class="badge">${screenName}</span>
                    <span class="badge muted">${scheduleRange}</span>
                </div>
                <div>
                    <h1 class="page-title">${show.movieTitle}</h1>
                </div>
            </div>
        `;
    }

    renderSeats(seats);
}

function renderSeats(seats) {
    if (!seatsRegion) {
        return;
    }

    if (!seats.length) {
        seatsRegion.innerHTML = `
            <div class="empty-state card" style="grid-column:1 / -1;">
                <strong>No seats available.</strong>
                <span>This show does not have any seats mapped yet.</span>
            </div>
        `;
        return;
    }

    const rows = Array.from(new Set(seats.map((seat) => seat.rowLabel))).sort();

    seatsRegion.innerHTML = `
        <div class="seat-legend">
            <span class="legend-item"><span class="legend-swatch available"></span>Available</span>
            <span class="legend-item"><span class="legend-swatch selected"></span>Booked</span>
            <span class="legend-item"><span class="legend-swatch booked"></span>Unavailable</span>
        </div>
        <div class="seat-rows">
            ${rows
                .map((rowLabel) => {
                    const rowSeats = seats
                        .filter((seat) => seat.rowLabel === rowLabel)
                        .sort(
                            (left, right) =>
                                Number(left.seatNumber) -
                                Number(right.seatNumber),
                        );

                    const seatTemplate = rowSeats
                        .map((seat) => {
                            const className = seat.booked
                                ? "seat booked"
                                : "seat available";
                            return `
                                <button
                                    class="${className}"
                                    type="button"
                                    data-seat-id="${seat.seatId}"
                                    data-seat-booked="${seat.booked}"
                                    aria-label="Seat ${seat.rowLabel}${seat.seatNumber}"
                                    ${seat.booked ? "disabled" : ""}
                                >
                                    ${seat.seatNumber}
                                </button>
                            `;
                        })
                        .join("");

                    return `
                        <div class="seat-row" style="grid-template-columns: 3rem repeat(${rowSeats.length}, minmax(2.5rem, 1fr));">
                            <span class="row-label">${rowLabel}</span>
                            ${seatTemplate}
                        </div>
                    `;
                })
                .join("")}
        </div>
    `;

    seatsRegion.querySelectorAll("[data-seat-id]").forEach((button) => {
        button.addEventListener("click", async () => {
            const seatId = Number(button.getAttribute("data-seat-id"));
            const originalText = button.textContent;

            button.disabled = true;
            button.textContent = "Booking...";

            try {
                await apiRequest("/bookings", {
                    method: "POST",
                    body: JSON.stringify({ showId, seatId }),
                });

                button.className = "seat booked-success";
                button.textContent = originalText;
                button.disabled = true;
                setFlash("Seat booked successfully.", "success");
                if (bookingNotice) {
                    bookingNotice.innerHTML = `<div class="notice success">Seat booked successfully.</div>`;
                }
            } catch (error) {
                button.disabled = false;
                button.textContent = originalText;

                if (error.status === 403) {
                    goProfile("verify");
                    return;
                }

                if (error.status === 401) {
                    goLogin(`/booking.html?showId=${showId}`);
                    return;
                }

                if (bookingNotice) {
                    bookingNotice.innerHTML = `<div class="notice danger">${error.message}</div>`;
                }
            }
        });
    });
}

async function init() {
    const user = await ensureAuthenticated({ requireVerified: true });
    if (!user) {
        return;
    }

    mountChrome({ active: "home", user });
    showFlashFromStorage(bookingNotice);

    if (!showId || Number.isNaN(showId)) {
        goHome();
        return;
    }

    try {
        await loadShowDetails();
    } catch (error) {
        renderError(error.message);
    }
}

init();
