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
  TextInputStyle,
} = require("discord.js");

const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("Bot online ✔"));
app.listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// ================= CONFIG =================
const CANALE_RICHIESTE = "1493595963942768860";
const CANALE_STAFF = "1493597555760824503";
const CANALE_FOTO = "1495160562097721634";

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645",
};

const userData = new Map();
const pending = new Map();

// ================= DOMANDE =================
const QUESTIONS = {
  A: [
    "Casco obbligatorio quando si guida una moto?",
    "Fari accesi anche di giorno?",
    "Rallentare in curva?",
    "Strada bagnata aumenta frenata?",
    "Guanti obbligatori?",
  ],
  B: [
    "Cintura sempre obbligatoria?",
    "Limite urbano 50 km/h?",
    "Distanza di sicurezza serve?",
    "Telefono senza vivavoce?",
    "Seggiolino bambini obbligatorio?",
  ],
  CD: [
    "Limite camion in città?",
    "Cosa fai al rosso?",
    "Precedenza incroci?",
    "Anabbaglianti quando?",
    "Ambulanza come comportarsi?",
  ],
};

// ================= READY =================
client.once("ready", async () => {
  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("#0B1F3A")
    .setDescription(`• 🏛️ Dipartimento Trasporti — __Sud Italy RP__

━━━━━━━━━━━━━━━━━━
📋 Patenti:
🅰️ Moto  
🅱️ Auto  
🅲 Camion/Bus  

━━━━━━━━━━━━━━━━━━
📝 Requisiti:
• cittadino registrato  
• comportamento corretto  
• niente sospensioni  
• conoscenza regole`);

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
  try {
    if (interaction.isButton() && interaction.customId === "start") {
      const member = interaction.member;

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("select")
          .setPlaceholder("Seleziona patente")
          .addOptions(
            ["A", "B", "CD"].map((t) => ({
              label: member.roles.cache.has(RUOLI[t])
                ? `Patente ${t} (GIÀ)`
                : `Patente ${t}`,
              value: t,
            }))
          )
      );

      return interaction.reply({
        content: "Seleziona patente:",
        components: [menu],
        ephemeral: true,
      });
    }

    // ================= SELECT =================
    if (interaction.isStringSelectMenu()) {
      const type = interaction.values[0];

      if (interaction.member.roles.cache.has(RUOLI[type])) {
        return interaction.reply({
          content: "❌ Hai già questa patente",
          ephemeral: true,
        });
      }

      userData.set(interaction.user.id, { type });

      const q = QUESTIONS[type];

      const modal = new ModalBuilder()
        .setCustomId("quiz")
        .setTitle("Quiz Patente");

      modal.addComponents(
        q.map((text, i) =>
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId(`q${i}`)
              .setLabel(text.slice(0, 45))
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        )
      );

      return interaction.showModal(modal);
    }

    // ================= QUIZ =================
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {
      const data = userData.get(interaction.user.id);
      if (!data) return;

      const answers = QUESTIONS[data.type].map((_, i) =>
        interaction.fields.getTextInputValue(`q${i}`)
      );

      userData.set(interaction.user.id, {
        ...data,
        answers,
        waitingPhoto: true,
      });

      return interaction.reply({
        content: `📸 Invia la foto nel canale o forum designato.`,
        ephemeral: true,
      });
    }

    // ================= BOTTONI =================
    if (interaction.isButton()) {
      const [action, userId] = interaction.customId.split("_");
      const req = pending.get(userId);
      if (!req) return;

      const modal = new ModalBuilder()
        .setCustomId(`motivo_${action}_${userId}`)
        .setTitle("Motivo obbligatorio");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("Scrivi motivo")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        )
      );

      return interaction.showModal(modal);
    }

    // ================= FINAL =================
    if (interaction.isModalSubmit() && interaction.customId.startsWith("motivo_")) {
      const [, action, userId] = interaction.customId.split("_");
      const req = pending.get(userId);
      if (!req) return;

      const reason = interaction.fields.getTextInputValue("reason");

      const member = await interaction.guild.members.fetch(req.userId).catch(() => null);

      const status = action === "accetta" ? "ACCETTATA" : "RIFIUTATA";

      const qa = req.answers
        .map((a, i) => `**${QUESTIONS[req.type][i]}**\n➡️ ${a}`)
        .join("\n\n");

      const embed = new EmbedBuilder()
        .setTitle("📋 ACCETTAZIONE DOCS PATENTE")
        .setColor("#a81900")
        .addFields(
          { name: "👤 Utente", value: `<@${req.userId}>` },
          { name: "🚗 Patente", value: req.type },
          { name: "📊 Esito", value: status },
          { name: "📋 Q&A", value: qa.slice(0, 1024) },
          { name: "📝 Motivo", value: reason },
          { name: "👮 Staff", value: `<@${interaction.user.id}>` }
        )
        .setImage(req.photo);

      const staff = await client.channels.fetch(CANALE_STAFF);
      const msg = await staff.send({ embeds: [embed] });

      const old = await staff.messages.fetch(req.messageId).catch(() => null);
      if (old) old.delete().catch(() => {});

      if (member && action === "accetta") {
        await member.roles.add(RUOLI[req.type]);
      }

      await interaction.reply({ content: "✔ Fatto", ephemeral: true });

      pending.delete(userId);
    }
  } catch (err) {
    console.log(err);
  }
});

// ================= FOTO + FORUM FIX =================
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  // 🔥 FIX FORUM + CANALE NORMALE
  const isForumThread =
    msg.channel.isThread?.() &&
    msg.channel.parentId === CANALE_FOTO;

  const isNormalChannel =
    msg.channel.id === CANALE_FOTO;

  if (!isForumThread && !isNormalChannel) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.waitingPhoto) return;

  const att = msg.attachments.first();
  if (!att) return;

  const qa = data.answers
    .map((a, i) => `**${QUESTIONS[data.type][i]}**\n➡️ ${a}`)
    .join("\n\n");

  const id = msg.author.id;

  const embed = new EmbedBuilder()
    .setTitle("📄 NUOVA RICHIESTA PATENTE")
    .setColor("#a81900")
    .addFields(
      { name: "👤 Utente", value: `<@${msg.author.id}>` },
      { name: "🚗 Patente", value: data.type },
      { name: "📋 Q&A", value: qa.slice(0, 1024) }
    )
    .setImage(att.url);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`accetta_${id}`).setLabel("ACCETTA").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`rifiuta_${id}`).setLabel("RIFIUTA").setStyle(ButtonStyle.Danger)
  );

  const staff = await client.channels.fetch(CANALE_STAFF);
  const sent = await staff.send({ embeds: [embed], components: [row] });

  pending.set(id, {
    userId: msg.author.id,
    type: data.type,
    answers: data.answers,
    photo: att.url,
    messageId: sent.id,
  });

  userData.delete(msg.author.id);
});

client.login(process.env.TOKEN);
