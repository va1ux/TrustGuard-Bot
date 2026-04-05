const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;
const VT_API_KEY = process.env.VT_API_KEY;

// simple link checker
async function checkVirusTotal(url) {
  const response = await axios.post(
    "https://www.virustotal.com/api/v3/urls",
    new URLSearchParams({ url }),
    {
      headers: {
        "x-apikey": VT_API_KEY,
        "content-type": "application/x-www-form-urlencoded"
      }
    }
  );

  const id = response.data.data.id;

  const report = await axios.get(
    `https://www.virustotal.com/api/v3/analyses/${id}`,
    {
      headers: { "x-apikey": VT_API_KEY }
    }
  );

  return report.data.data.attributes;
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // auto-detect links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = message.content.match(urlRegex);

  if (urls) {
    message.reply("🛡️ Scanning link... please wait");

    try {
      const result = await checkVirusTotal(urls[0]);

      const stats = result.stats;

      message.reply(
        `🔍 VirusTotal Results:\n` +
        `🟢 Safe: ${stats.harmless || 0}\n` +
        `🟡 Suspicious: ${stats.suspicious || 0}\n` +
        `🔴 Malicious: ${stats.malicious || 0}`
      );
    } catch (err) {
      message.reply("⚠️ Could not scan this link.");
    }
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(TOKEN);