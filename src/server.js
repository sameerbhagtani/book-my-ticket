import "dotenv/config";

import app from "./app.js";
import db from "./db/index.js";

async function main() {
    try {
        await db.execute("SELECT 1");
        console.log(`✅ DB Connected`);

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`✅ Server started at PORT: ${PORT}`);
        });
    } catch (err) {
        console.error(`❌ Failed to start: ${err}`);
        process.exit(1);
    }
}

main();
