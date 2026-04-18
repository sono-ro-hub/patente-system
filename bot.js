const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("Bot online"));
app.listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ================= CONFIG =================
const CANALE_RICHIESTE = "1493595963942768860";
const CANALE_STAFF = "1493597555760824503";
const CANALE_FOTO = "1495160562097721634";

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

const userData = new Map();
const pending = new Map();

// ================= 5 DOMANDE (STABILI) =================
const QUIZ = {
  A: [
    "Il casco è obbligatorio quando guidi la moto?",
    "I fari devono essere accesi anche di giorno?",
    "In curva bisogna rallentare?",
    "Su strada bagnata aumenta la frenata?",
    "Il casco deve essere sempre allacciato?"
  ],
  B: [
    "La cintura va sempre allacciata?",
    "Il limite in città è 50 km/h?",
    "Il semaforo rosso significa stop?",
    "La distanza di sicurezza serve?",
    "Si può usare il telefono alla guida?"
  ],
  CD: [
    "Cosa fai al semaforo rosso?",
    "Chi ha precedenza agli incroci?",
    "Quando accendi i fari?",
    "Cos’è la distanza di sicurezza?",
    "Come comportarsi con ambulanza?"
  ]
};

// ================= READY =================
client.once("ready", async () => {

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("#0B1F3A")
    .setDescription(`• 🏛️ Dipartimento Trasporti — __Sud Italy RP__

Se desideri metterti alla guida in modo regolare, devi ottenere una licenza ufficiale.

━━━━━━━━━━━━━━━━━━
📋 Tipi di patente
🅰️ A - Moto  
🅱️ B - Auto  
🅲 CD - Mezzi pesanti  

━━━━━━━━━━━━━━━━━━
⚠️ Rispetta le regole RP`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("INIZIA PATENTE")
      .setStyle(ButtonStyle.Primary)
  );

  await ch.send({ embeds: [embed], components: [row] });
});

// ================= START =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;

  if (interaction.customId === "start") {

    const member = interaction.member;

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select")
        .setPlaceholder("Seleziona patente")
        .addOptions([
          {
            label: member.roles.cache.has(RUOLI.A) ? "A (GIÀ POSSEDUTA)" : "Patente A",
            value: "A"
          },
          {
            label: member.roles.cache.has(RUOLI.B) ? "B (GIÀ POSSEDUTA)" : "Patente B",
            value: "B"
          },
          {
            label: member.roles.cache.has(RUOLI.CD) ? "CD (GIÀ POSSEDUTA)" : "Patente C-D",
            value: "CD"
          }
        ])
    );

    return interaction.reply({
      content: "Seleziona patente:",
      components: [menu],
      flags: 64
    });
  }
});

// ================= SELECT =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isStringSelectMenu()) return;

  const type = interaction.values[0];

  const member = interaction.member;

  if (member.roles.cache.has(RUOLI[type])) {
    return interaction.reply({
      content: "❌ Hai già questa patente",
      flags: 64
    });
  }

  userData.set(interaction.user.id, {
    type,
    answers: []
  });

  const modal = new ModalBuilder()
    .setCustomId("quiz")
    .setTitle("Quiz Patente");

  QUIZ[type].forEach((q, i) => {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(`q${i}`)
          .setLabel(q.slice(0, 45))
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );
  });

  await interaction.showModal(modal);
});

// ================= QUIZ =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isModalSubmit()) return;
  if (interaction.customId !== "quiz") return;

  const data = userData.get(interaction.user.id);
  if (!data) return;

  data.answers = QUIZ[data.type].map((_, i) =>
    interaction.fields.getTextInputValue(`q${i}`)
  );

  data.waitingPhoto = true;

  return interaction.reply({
    content: `📸 Vai nel canale <#${CANALE_FOTO}> e invia la foto.`,
    flags: 64
  });
});

// ================= FOTO =================
client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.waitingPhoto) return;

  const attachment = msg.attachments.first();
  if (!attachment) return;

  const id = msg.author.id + Date.now();

  pending.set(id, {
    userId: msg.author.id,
    type: data.type,
    answers: data.answers,
    photo: attachment.url
  });

  userData.delete(msg.author.id);

  const staff = await client.channels.fetch(CANALE_STAFF);

  const embed = new EmbedBuilder()
    .setTitle("📄 NUOVA PATENTE")
    .setColor("#a81900")
    .addFields(
      { name: "👤 Utente", value: `<@${msg.author.id}>` },
      { name: "🚗 Patente", value: data.type }
    )
    .setImage(attachment.url);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`accetta_${id}`).setLabel("ACCETTA").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`rifiuta_${id}`).setLabel("RIFIUTA").setStyle(ButtonStyle.Danger)
  );

  const sent = await staff.send({ embeds: [embed], components: [row] });

  pending.get(id).messageId = sent.id;
});

// ================= DECISIONE =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;

  const [action, id] = interaction.customId.split("_");
  const req = pending.get(id);
  if (!req) return;

  const member = await interaction.guild.members.fetch(req.userId).catch(() => null);

  if (member && action === "accetta") {
    await member.roles.add(RUOLI[req.type]);
  }

  const staff = await client.channels.fetch(CANALE_STAFF);

  const msg = await staff.messages.fetch(req.messageId).catch(() => null);
  if (msg) await msg.delete();

  pending.delete(id);

  return interaction.reply({
    content: "✔ Fatto",
    flags: 64
  });
});

client.login(process.env.TOKEN);
