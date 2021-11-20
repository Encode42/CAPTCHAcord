import { Context } from "oak/mod.ts";
import { DOMParser } from "dom/deno-dom-wasm.ts";
import { app } from "../../index.ts";
import { config, Guild } from "../../../config/index.ts";
import { getGuild } from "../../../bot/index.ts";

/**
 * Invite webpages endpoint
 */
async function route(): Promise<void> {
    // Initialize sites
    const sites: Map<String, String> = new Map();
    for (const key of Object.keys(config.discord.guilds)) {
        const value: Guild = config.discord.guilds[key];

        // Generate site data
        const page = Deno.readTextFileSync(`${Deno.cwd()}/public/endpoint.html`);
        const document = new DOMParser().parseFromString(page, "text/html");
        const script = document?.getElementById("data-script");
        if (script) {
            script.innerHTML = `
                const siteKey = "${config.recaptcha["site-key"]}";
                const serverName = "${value?.name || (await getGuild(key)).name}";
                const key = "${key}";
            `;
        }

        // Import the script
        const endpoint = value?.endpoint || `/${key}`;
        sites.set(endpoint, document?.documentElement?.outerHTML || page);
    }

    // Serve endpoints
    app.use(async (context: Context, next: Function) => {
        // Ensure headers and existence then serve
        if (sites.has(context.request.url.pathname)) {
            context.response.body = sites.get(context.request.url.pathname);
        } else {
            await next();
        }
    });
}

export { route };