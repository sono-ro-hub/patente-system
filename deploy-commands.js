const { REST, Routes } = require("discord.js");
const fs = require("fs");
const config = require("./config.json");

const commands = [];

const files = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of files) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(config.clientId, config.guildId),
    { body: commands }
  );

  console.log("✅ Comandi registrati!");
})();
