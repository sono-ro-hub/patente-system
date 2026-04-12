const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");

// 🌐 EXPRESS (serve SOLO per Render uptime, lo lasciamo)
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("🤖 Bot Patente online");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🌐 Server attivo sulla porta " + PORT);
});

// 🤖 DISCORD CLIENT
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// 📦 CARICA COMANDI
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// ✅ BOT ONLINE
client.once("ready", () => {
  console.log(`🤖 Bot Patente online: ${client.user.tag}`);
});

// 🎮 INTERACTION SYSTEM (COMMAND + BUTTONS)
client.on("interactionCreate", async interaction => {

  // =========================
  // SLASH COMMANDS
  // =========================
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    await command.execute(interaction, client);
  }

  // =========================
  // ROLEPLAY BUTTON SYSTEM
  // =========================
  if (interaction.isButton()) {

    const id = interaction.customId;

    // 📌 RICHIESTA PATENTE
    if (id.startsWith("req_")) {

      const type = id.split("_")[1];

      const embed = new EmbedBuilder()
        .setTitle("📋 MODULO PATENTE")
        .setDescription(`
🏁 Hai scelto **Patente ${type}**

⚠️ OBBLIGATORIO:
- Compilare quiz
- Pagare 3k
- Inviare screenshot pagamento
- Attendere approvazione staff
        `);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`quiz_${type}_${interaction.user.id}`)
          .setLabel("📋 Quiz")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId(`pay_${type}_${interaction.user.id}`)
          .setLabel("💳 Pagamento")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(`send_${type}_${interaction.user.id}`)
          .setLabel("📤 Invia allo staff")
          .setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    // 💳 PAGAMENTO
    if (id.startsWith("pay_")) {
      return interaction.reply({
        content: "💳 Invia screenshot pagamento nel canale staff.",
        ephemeral: true
      });
    }

    // 📤 INVIO STAFF
    if (id.startsWith("send_")) {

      const staffChannel = interaction.guild.channels.cache.find(c => c.name === "staff-patenti");

      const embed = new EmbedBuilder()
        .setTitle("🚗 NUOVA RICHIESTA PATENTE")
        .setDescription(`
👤 Utente: <@${interaction.user.id}>
📌 Tipo: ${id.split("_")[1]}

⚠️ Controllare:
- Quiz
- Pagamento
- Screenshot
        `);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`accept_${interaction.user.id}`)
          .setLabel("✅ Accetta")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(`reject_${interaction.user.id}`)
          .setLabel("❌ Rifiuta")
          .setStyle(ButtonStyle.Danger)
      );

      await staffChannel.send({ embeds: [embed], components: [row] });

      return interaction.reply({
        content: "📤 Richiesta inviata allo staff!",
        ephemeral: true
      });
    }

    // ✅ ACCETTA / ❌ RIFIUTA
    if (id.startsWith("accept_")) {
      return interaction.update({
        content: "✅ Patente APPROVATA",
        components: []
      });
    }

    if (id.startsWith("reject_")) {
      return interaction.update({
        content: "❌ Patente RIFIUTATA",
        components: []
      });
    }
  }
});

// 🔑 LOGIN
client.login(process.env.TOKEN);
