import dotenv from "dotenv"

dotenv.config();
const {
	DISCORD_TOKEN,
	CLIENT_ID,
	GUILD_ID,
	SPOTIFY_CLIENT_ID,
	SPOTIFY_CLIENT_SECRET
} = process.env;

if (
	!DISCORD_TOKEN ||
	!CLIENT_ID ||
	!GUILD_ID ||
	!SPOTIFY_CLIENT_ID ||
	!SPOTIFY_CLIENT_SECRET
	) throw new Error("Missing environment variables");

const config: Record<string, string> = {
	DISCORD_TOKEN,
	CLIENT_ID,
	GUILD_ID,
	SPOTIFY_CLIENT_ID,
	SPOTIFY_CLIENT_SECRET
};

export default config;
