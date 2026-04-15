export const VERIFY_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify Your Email</title>
    </head>
    <body
        style="
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        "
    >
        <div
            style="
                background: linear-gradient(to right, #16a34a, #22c55e);
                padding: 20px;
                text-align: center;
            "
        >
            <h1 style="color: white; margin: 0">
                Welcome to ChaiCode Cinema 🎬
            </h1>
        </div>

        <div
            style="
                background-color: #f0fdf4;
                padding: 20px;
                border-radius: 0 0 6px 6px;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
            "
        >
            <p>Hello,</p>

            <p>
                Please verify your email address to activate your ChaiCode Cinema account:
            </p>

            <div style="text-align: center; margin: 30px 0">
                <a
                    href="{verificationLink}"
                    style="
                        background-color: #16a34a;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: bold;
                        display: inline-block;
                    "
                >
                    Verify Email
                </a>
            </div>

            <p>
                This link is valid for <strong>15 minutes</strong>.
                If you didn't create this account, you can safely ignore this email.
            </p>

            <p>
                Regards,<br />
                <strong>Team ChaiCode Cinema</strong>
            </p>
        </div>

        <div
            style="
                text-align: center;
                margin-top: 20px;
                color: #888;
                font-size: 0.8em;
            "
        >
            <p>This is an automated message. Please do not reply.</p>
        </div>
    </body>
</html>
`;

export const RESET_PASSWORD_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset Your Password</title>
    </head>
    <body
        style="
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        "
    >
        <div
            style="
                background: linear-gradient(to right, #16a34a, #22c55e);
                padding: 20px;
                text-align: center;
            "
        >
            <h1 style="color: white; margin: 0">
                Reset Your Password 🔐
            </h1>
        </div>

        <div
            style="
                background-color: #f0fdf4;
                padding: 20px;
                border-radius: 0 0 6px 6px;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
            "
        >
            <p>Hello,</p>

            <p>
                We received a request to reset your password for your ChaiCode Cinema account.
                Click the button below to proceed:
            </p>

            <div style="text-align: center; margin: 30px 0">
                <a
                    href="{resetLink}"
                    style="
                        background-color: #16a34a;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: bold;
                        display: inline-block;
                    "
                >
                    Reset Password
                </a>
            </div>

            <p>
                This link is valid for <strong>15 minutes</strong>.
                If you didn't request a password reset, you can ignore this email.
            </p>

            <p>
                Regards,<br />
                <strong>Team ChaiCode Cinema</strong>
            </p>
        </div>

        <div
            style="
                text-align: center;
                margin-top: 20px;
                color: #888;
                font-size: 0.8em;
            "
        >
            <p>This is an automated message. Please do not reply.</p>
        </div>
    </body>
</html>
`;
