const { REST, Routes } = require("discord.js");
const config = require("./config.json");

const commands = [
  {
    name: "patente",
    description: "📋 Menu patenti"
  }
];

const rest = new REST({ version: 10 }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );

    console.log("✅ Comandi registrati!");
  } catch (err) {
    console.error("❌ Errore:", err);
  }
})();
