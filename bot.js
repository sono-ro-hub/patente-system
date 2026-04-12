const {
  Client,
  GatewayIntentBits,
  Collection,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const fs = require("fs");
const express = require("express");

// 🌐 EXPRESS SERVER (OBBLIGATORIO PER RENDER WEB)
const app = express();

app.get("/", (req, res) => {
  res.send("🤖 Bot Patente online");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("🌐 Server attivo sulla porta " + PORT);
});

// 🤖 DISCORD BOT
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// 📦 comandi
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// ✅ READY
client.once("clientReady", () => {
  console.log(`🤖 Bot Patente online: ${client.user.tag}`);
});

// 🎮 INTERACTIONS
client.on("interactionCreate", async interaction => {

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    await command.execute(interaction, client);
  }

  if (!interaction.isButton()) return;

  const id = interaction.customId;

  // 📋 RICHIESTA PATENTE
  if (id.startsWith("req_")) {
    const type = id.split("_")[1];

    const embed = new EmbedBuilder()
      .setTitle("📋 MODULO PATENTE")
      .setDescription(
`🏁 Patente scelta: **${type}**

📌 OBBLIGATORIO:
• Compilare quiz
• Pagare 3k
• Inviare foto pagamento
• Attendere staff`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quiz_${type}`)
        .setLabel("📋 Quiz")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`pay_${type}`)
        .setLabel("💳 Pagamento")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`send_${type}`)
        .setLabel("📤 Invia richiesta")
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  // 💳 PAGAMENTO
  if (id.startsWith("pay_")) {
    return interaction.reply({
      content: "💳 Invia la foto pagamento nel canale PAGAMENTI PATENTE.",
      ephemeral: true
    });
  }

  // 📤 INVIO STAFF
  if (id.startsWith("send_")) {

    const channel = interaction.guild.channels.cache.find(c =>
      c.name === "staff-patenti"
    );

    const embed = new EmbedBuilder()
      .setTitle("🚗 NUOVA RICHIESTA PATENTE")
      .setDescription(
`👤 Utente: <@${interaction.user.id}>
📌 Tipo: ${id.split("_")[1]}

⚠️ Controlli:
• Quiz
• Pagamento
• Screenshot`
      );

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

    await channel.send({ embeds: [embed], components: [row] });

    return interaction.reply({
      content: "📤 Inviato allo staff!",
      ephemeral: true
    });
  }

  // ✅ / ❌ STAFF
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
});

client.login(process.env.TOKEN);
