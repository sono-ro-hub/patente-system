const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot online ✅");
});

app.listen(PORT, () => {
  console.log(`🌐 Server attivo sulla porta ${PORT}`);
});

// ANTI CRASH
process.on("unhandledRejection", (err) => {
  console.log("⚠️ Errore ignorato:", err);
});

// BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const userData = new Map();

// GENERA CODICE
function generatePaymentCode() {
  return "PAT-" + Math.floor(10000 + Math.random() * 90000);
}

// READY
client.once("clientReady", () => {
  console.log(`🤖 Bot online: ${client.user.tag}`);
});

// COMANDO /patente
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "patente") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("req_auto")
        .setLabel("🚗 Patente Auto")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("req_moto")
        .setLabel("🏍️ Patente Moto")
        .setStyle(ButtonStyle.Success)
    );

    return interaction.reply({
      content: "📋 Scegli la patente:",
      components: [row]
    });
  }
});

// BUTTON
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  const id = interaction.customId;
  const userId = interaction.user.id;

  if (!userData.has(userId)) {
    userData.set(userId, { step: 0, code: null });
  }

  const data = userData.get(userId);

  // START
  if (id.startsWith("req_")) {
    const type = id.split("_")[1];

    data.type = type;
    data.step = 1;
    data.code = generatePaymentCode();

    const embed = new EmbedBuilder()
      .setTitle("📋 MODULO PATENTE")
      .setDescription(
`🏁 Patente: **${type}**

💳 Codice pagamento:
\`${data.code}\`

Step:
1️⃣ Quiz
2️⃣ Pagamento
3️⃣ Invio staff`
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
        .setLabel("📤 Invia staff")
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  // QUIZ
  if (id.startsWith("quiz_")) {
    data.step = 2;
    return interaction.reply({ content: "✅ Quiz completato", ephemeral: true });
  }

  // PAY
  if (id.startsWith("pay_")) {
    data.step = 3;
    return interaction.reply({
      content: `📸 Invia screenshot + codice: ${data.code}`,
      ephemeral: true
    });
  }

  // SEND STAFF
  if (id.startsWith("send_")) {
    if (data.step < 3) {
      return interaction.reply({
        content: "❌ Completa prima tutto",
        ephemeral: true
      });
    }

    const channel = interaction.guild.channels.cache.find(
      c => c.name === "staff-patenti"
    );

    if (!channel) {
      return interaction.reply({
        content: "❌ Canale staff-patenti non trovato",
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("🚗 NUOVA RICHIESTA")
      .setDescription(
`👤 <@${userId}>
📌 Tipo: ${data.type}
💳 Codice: ${data.code}`
      );

    await channel.send({ embeds: [embed] });

    return interaction.reply({
      content: "✅ Inviato allo staff",
      ephemeral: true
    });
  }
});

// CONTROLLO MESSAGGI (FIX SPAM)
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const data = userData.get(message.author.id);
  if (!data || data.step !== 3) return;

  // SOLO se ha scritto qualcosa collegato
  if (!message.content.includes(data.code) && message.attachments.size === 0) return;

  const channel = message.guild.channels.cache.find(
    c => c.name === "staff-patenti"
  );

  if (!channel) return;

  await channel.send({
    content: `💳 Pagamento da <@${message.author.id}> | Codice: ${data.code}`,
    files: message.attachments.map(a => a.url)
  });

  message.reply("✅ Pagamento inviato!");
});

// LOGIN
client.login(process.env.TOKEN);
