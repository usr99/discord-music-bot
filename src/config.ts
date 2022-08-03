import dotenv from "dotenv"

dotenv.config();
const {
	DISCORD_TOKEN,
	CLIENT_ID,
	GUILD_ID,
	SPOTIFY_CLIENT_ID,
	SPOTIFY_CLIENT_SECRET,
	SPOTIFY_CLIENT_CALLBACK
} = process.env;

if (
	!DISCORD_TOKEN ||
	!CLIENT_ID ||
	!GUILD_ID ||
	!SPOTIFY_CLIENT_ID ||
	!SPOTIFY_CLIENT_SECRET ||
	!SPOTIFY_CLIENT_CALLBACK
) throw new Error("Missing environment variables");

const config: Record<string, string> = {
	DISCORD_TOKEN,
	CLIENT_ID,
	GUILD_ID,
	SPOTIFY_CLIENT_ID,
	SPOTIFY_CLIENT_SECRET,
	SPOTIFY_CLIENT_CALLBACK
};

export default config;