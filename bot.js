const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// 🔥 IMPORT HANDLERS
require("./handlers/start")(client);
require("./handlers/quizFlow")(client);
require("./handlers/staff")(client);

// 🔥 FIX RENDER (NO PORT TIMEOUT)
require("http")
  .createServer((req, res) => {
    res.end("Bot online");
  })
  .listen(process.env.PORT || 3000);

client.once("ready", () => {
  console.log("BOT PRONTO");
});

client.login(process.env.TOKEN);
