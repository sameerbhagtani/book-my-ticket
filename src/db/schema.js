import {
    pgTable,
    serial,
    varchar,
    integer,
    boolean,
    timestamp,
    unique,
    index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),

    name: varchar("name", { length: 50 }).notNull(),
    email: varchar("email", { length: 100 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),

    isVerified: boolean("is_verified").default(false).notNull(),
    isAdmin: boolean("is_admin").default(false).notNull(),

    verificationToken: varchar("verification_token", { length: 255 }),
    verificationExpires: timestamp("verification_expires"),
    resetPasswordToken: varchar("reset_password_token", { length: 255 }),
    resetPasswordExpires: timestamp("reset_password_expires"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const screens = pgTable("screens", {
    id: serial("id").primaryKey(),

    name: varchar("name", { length: 50 }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const seats = pgTable(
    "seats",
    {
        id: serial("id").primaryKey(),

        screenId: integer("screen_id")
            .notNull()
            .references(() => screens.id, { onDelete: "cascade" }),

        rowLabel: varchar("row_label", { length: 5 }).notNull(),
        seatNumber: integer("seat_number").notNull(),

        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (t) => [
        unique().on(t.screenId, t.rowLabel, t.seatNumber),
        index("seats_screen_id_idx").on(t.screenId),
    ],
);

export const shows = pgTable(
    "shows",
    {
        id: serial("id").primaryKey(),

        screenId: integer("screen_id")
            .notNull()
            .references(() => screens.id, { onDelete: "cascade" }),

        movieTitle: varchar("movie_title", { length: 100 }).notNull(),

        startTime: timestamp("start_time").notNull(),
        endTime: timestamp("end_time").notNull(),

        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (t) => [
        index("shows_screen_id_idx").on(t.screenId),
        index("shows_start_time_idx").on(t.startTime),
    ],
);

export const showSeats = pgTable(
    "show_seats",
    {
        id: serial("id").primaryKey(),

        showId: integer("show_id")
            .notNull()
            .references(() => shows.id, { onDelete: "cascade" }),

        seatId: integer("seat_id")
            .notNull()
            .references(() => seats.id, { onDelete: "cascade" }),

        bookedBy: integer("booked_by").references(() => users.id, {
            onDelete: "set null",
        }),

        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (t) => [
        unique().on(t.showId, t.seatId),
        index("show_seats_show_id_idx").on(t.showId),
    ],
);
