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

// 🌐 EXPRESS (Render fix timeout)
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("🤖 Bot Patente online");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🌐 Server attivo sulla porta " + PORT);
});

// 🤖 DISCORD CLIENT (AGGIUNTI INTENTS)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// 🧠 DATI UTENTI
const userData = new Map();

// 📦 CARICA COMANDI
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// ✅ BOT ONLINE
client.once("clientReady", () => {
  console.log(`🤖 Bot Patente online: ${client.user.tag}`);
});

// 🎮 INTERACTION SYSTEM
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
  // BUTTON SYSTEM
  // =========================
  if (!interaction.isButton()) return;

  const id = interaction.customId;
  const userId = interaction.user.id;

  if (!userData.has(userId)) {
    userData.set(userId, { step: 0 });
  }

  const data = userData.get(userId);

  // 📌 RICHIESTA PATENTE
  if (id.startsWith("req_")) {

    const type = id.split("_")[1];
    data.type = type;

    const embed = new EmbedBuilder()
      .setTitle("📋 MODULO PATENTE")
      .setDescription(
`🏁 Hai scelto **Patente ${type}**

⚠️ OBBLIGATORIO:
- Compilare quiz
- Pagare 3k
- Inviare screenshot pagamento
- Attendere approvazione staff`
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
        .setLabel("📤 Invia allo staff")
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  // 💳 PAGAMENTO (MODIFICATO)
  if (id.startsWith("pay_")) {

    data.step = 3;

    return interaction.reply({
      content:
        "💳 **PAGAMENTO PATENTE**\n\n" +
        "📌 Invia ora lo screenshot del pagamento QUI in chat.\n\n" +
        "⚠️ Deve essere un'immagine!",
      ephemeral: true
    });
  }

  // 📤 INVIO STAFF
  if (id.startsWith("send_")) {

    const staffChannel = interaction.guild.channels.cache.find(c => c.name === "staff-patenti");

    const embed = new EmbedBuilder()
      .setTitle("🚗 NUOVA RICHIESTA PATENTE")
      .setDescription(
`👤 Utente: <@${userId}>
📌 Tipo: ${data.type}`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`accept_${userId}`)
        .setLabel("✅ Accetta")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`reject_${userId}`)
        .setLabel("❌ Rifiuta")
        .setStyle(ButtonStyle.Danger)
    );

    await staffChannel.send({ embeds: [embed], components: [row] });

    return interaction.reply({
      content: "📤 Richiesta inviata allo staff!",
      ephemeral: true
    });
  }

  // ✅ ACCETTA
  if (id.startsWith("accept_")) {
    return interaction.update({
      content: "✅ Patente APPROVATA",
      components: []
    });
  }

  // ❌ RIFIUTA
  if (id.startsWith("reject_")) {
    return interaction.update({
      content: "❌ Patente RIFIUTATA",
      components: []
    });
  }
});

// 📸 RICEZIONE SCREENSHOT PAGAMENTO
client.on("messageCreate", async message => {

  if (message.author.bot) return;

  const userId = message.author.id;
  const data = userData.get(userId);

  if (!data || data.step !== 3) return;

  if (message.attachments.size === 0) {
    return message.reply("❌ Devi inviare uno screenshot del pagamento.");
  }

  const attachment = message.attachments.first();

  const staffChannel = message.guild.channels.cache.find(
    c => c.name === "staff-patenti"
  );

  if (!staffChannel) return;

  await staffChannel.send({
    content:
      `💳 **PAGAMENTO RICEVUTO**\n` +
      `👤 Utente: <@${userId}>\n` +
      `📌 Tipo: ${data.type}`,
    files: [attachment.url]
  });

  return message.reply("✅ Pagamento inviato allo staff!");
});

// 🔑 LOGIN
client.login(process.env.TOKEN);
