import axios from "axios";
import {
    VERIFY_EMAIL_TEMPLATE,
    RESET_PASSWORD_TEMPLATE,
} from "./mailTemplates.js";

const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER_MAIL;
const senderName = "ChaiCode Cinema";

export async function sendVerificationEmail(email, token) {
    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

    const htmlContent = VERIFY_EMAIL_TEMPLATE.replace(
        "{verificationLink}",
        verificationLink,
    );

    await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
            sender: { name: senderName, email: senderEmail },
            to: [{ email }],
            subject: "Verify your email - ChaiCode Cinema",
            htmlContent,
        },
        {
            headers: {
                "api-key": apiKey,
                "Content-Type": "application/json",
            },
        },
    );
}

export async function sendResetPasswordEmail(email, token) {
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    const htmlContent = RESET_PASSWORD_TEMPLATE.replace(
        "{resetLink}",
        resetLink,
    );

    await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
            sender: { name: senderName, email: senderEmail },
            to: [{ email }],
            subject: "Reset your password - ChaiCode Cinema",
            htmlContent,
        },
        {
            headers: {
                "api-key": apiKey,
                "Content-Type": "application/json",
            },
        },
    );
}
