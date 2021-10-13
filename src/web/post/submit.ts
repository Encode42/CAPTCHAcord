import { Context } from "oak/mod.ts";
import { Request } from "request/mod.ts";
import { create as createInvite } from "../../bot/invite/create.ts";
import { router } from "../index.ts";
import { tokens } from "../../config/index.ts";

interface Grecaptcha {
    success: boolean,
    // eslint-disable-next-line camelcase
    challenge_ts: string,
    hostname: string
}

/**
 * Form submit endpoint
 */
function route(): void {
    router.post("/submit", async (context: Context) => {
        // Request body
        const req = await context.request.body().value;

        // Captcha response
        const captcha = req["g-recaptcha-response"];

        // Invalid captcha response
        if (!captcha) {
            context.response.status = 400;
            return;
        }

        // Verify the captcha
        const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${tokens.recaptcha}&response=${captcha}&remoteip=${context.request.ip}`;
        const response: Grecaptcha = await Request.get(verificationURL);

        if (response.success) {
            // Create the invite
            const url = await createInvite();

            // Respond with the link
            context.response.body = { url: url };
        } else {
            // Invalid captcha
            captcha.response.status = 403;
        }
    });
}

export { route };