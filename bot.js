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

// 🔴 METTI QUI I TUOI ID REALI
const CHANNEL_PATENTI = "1493595963942768860";
const CHANNEL_STAFF = "1493597555760824503";
const ROLE_PATENTE = "1492884347584385164";

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
client.once("clientReady", async () => {
  console.log(`🤖 Bot online: ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_PATENTI);

  if (!channel) return console.log("❌ Canale patenti non trovato");

  const embed = new EmbedBuilder()
    .setTitle("🚗 RICHIESTA PATENTE")
    .setDescription("Premi il bottone per iniziare");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start_patente")
      .setLabel("📋 Richiedi patente")
      .setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [embed], components: [row] });
});

// BUTTON SYSTEM
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  const userId = interaction.user.id;

  if (!userData.has(userId)) {
    userData.set(userId, { step: 0, code: null, done: false });
  }

  const data = userData.get(userId);

  // 🚫 ANTI DOPPIA RICHIESTA
  if (data.done && interaction.customId === "start_patente") {
    return interaction.reply({
      content: "❌ Hai già richiesto la patente",
      ephemeral: true
    });
  }

  // START
  if (interaction.customId === "start_patente") {
    data.step = 1;
    data.code = generatePaymentCode();

    const embed = new EmbedBuilder()
      .setTitle("📋 MODULO PATENTE")
      .setDescription(
`💳 Codice pagamento:
\`${data.code}\`

Step:
1️⃣ Quiz
2️⃣ Pagamento
3️⃣ Invio staff`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("quiz")
        .setLabel("📋 Quiz")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("pay")
        .setLabel("💳 Pagamento")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("send")
        .setLabel("📤 Invia staff")
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  // QUIZ
  if (interaction.customId === "quiz") {
    data.step = 2;
    return interaction.reply({ content: "✅ Quiz completato", ephemeral: true });
  }

  // PAGAMENTO
  if (interaction.customId === "pay") {
    data.step = 3;
    return interaction.reply({
      content: `📸 Invia screenshot + codice: ${data.code}`,
      ephemeral: true
    });
  }

  // INVIO STAFF
  if (interaction.customId === "send") {
    if (data.step < 3) {
      return interaction.reply({
        content: "❌ Completa prima tutto",
        ephemeral: true
      });
    }

    const channel = await client.channels.fetch(CHANNEL_STAFF);

    const embed = new EmbedBuilder()
      .setTitle("🚗 NUOVA RICHIESTA")
      .setDescription(
`👤 <@${userId}>
💳 Codice: ${data.code}`
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

    await channel.send({ embeds: [embed], components: [row] });

    return interaction.reply({
      content: "✅ Inviato allo staff",
      ephemeral: true
    });
  }

  // ✅ ACCETTA
  if (interaction.customId.startsWith("accept_")) {
    const targetId = interaction.customId.split("_")[1];

    const member = await interaction.guild.members.fetch(targetId);
    await member.roles.add(ROLE_PATENTE);

    userData.get(targetId).done = true;

    return interaction.update({
      content: "✅ Patente approvata",
      components: []
    });
  }

  // ❌ RIFIUTA
  if (interaction.customId.startsWith("reject_")) {
    const targetId = interaction.customId.split("_")[1];

    userData.delete(targetId);

    return interaction.update({
      content: "❌ Patente rifiutata",
      components: []
    });
  }
});

// CONTROLLO PAGAMENTO
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const data = userData.get(message.author.id);
  if (!data || data.step !== 3) return;

  if (!message.content.includes(data.code) && message.attachments.size === 0) return;

  const channel = await client.channels.fetch(CHANNEL_STAFF);

  await channel.send({
    content: `💳 Pagamento <@${message.author.id}> | Codice: ${data.code}`,
    files: message.attachments.map(a => a.url)
  });

  message.reply("✅ Pagamento inviato!");
});

// LOGIN
client.login(process.env.TOKEN);
