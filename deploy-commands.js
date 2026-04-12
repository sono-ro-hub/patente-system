const { REST, Routes } = require("discord.js");
const fs = require("fs");
const config = require("./config.json");

const commands = [];

// 📦 carica comandi
const commandFiles = fs
  .readdirSync("./commands")
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  // 🛑 sicurezza base
  if (!command.data) {
    console.log(`⚠️ Comando ignorato (manca data): ${file}`);
    continue;
  }

  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("📡 Registro comandi slash...");

    // 🔥 IMPORTANTE: verifica clientId e guildId
    if (!config.clientId || !config.guildId) {
      throw new Error("clientId o guildId mancanti nel config.json");
    }

    await rest.put(
      Routes.applicationGuildCommands(
        config.clientId,
        config.guildId
      ),
      { body: commands }
    );

    console.log("✅ Comandi slash registrati con successo!");
  } catch (error) {
    console.error("❌ Errore registrazione comandi:", error);
  }
})();
