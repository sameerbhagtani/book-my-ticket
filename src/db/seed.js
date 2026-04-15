import "dotenv/config";

import db from "./index.js";
import { screens, seats } from "./schema.js";

async function seed() {
    console.log("🌱 Seeding database...");

    await db.delete(seats);
    await db.delete(screens);

    const insertedScreens = await db
        .insert(screens)
        .values([{ name: "Screen 1" }, { name: "Screen 2" }])
        .returning();

    const rows = ["A", "B", "C", "D"];
    const seatsPerRow = 10;

    const seatData = [];

    for (const screen of insertedScreens) {
        for (const row of rows) {
            for (let i = 1; i <= seatsPerRow; i++) {
                seatData.push({
                    screenId: screen.id,
                    rowLabel: row,
                    seatNumber: i,
                });
            }
        }
    }

    await db.insert(seats).values(seatData);

    console.log("✅ Seeding complete");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
