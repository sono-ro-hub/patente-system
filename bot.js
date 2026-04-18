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
    "Rallentare prima della curva?",
    "Guanti obbligatori?",
    "Frenata su bagnato aumenta?",
  ],
  B: [
    "Cintura sempre obbligatoria?",
    "Limite urbano 50 km/h?",
    "Sorpasso con linea continua?",
    "Serve distanza sicurezza?",
    "Specchietti obbligatori?",
  ],
  CD: [
    "Limite camion in città?",
    "Semaforo rosso cosa fai?",
    "Precedenza agli incroci?",
    "Anabbaglianti quando?",
    "Ambulanza come ti comporti?",
  ],
};

// ================= READY =================
client.once("ready", async () => {
  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("#0B1F3A")
    .setDescription(`• 🏛️ Dipartimento Trasporti — __Sud Italy RP__

Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale rilasciata dal dipartimento.

━━━━━━━━━━━━━━━━━━
📋 Tipi di patente

__🅰️ Patente A__
Motocicli e due ruote.

__🅱️ Patente B__
Auto e veicoli leggeri.

__🅲 Patente C-D__
Camion, pullman e autobus.

━━━━━━━━━━━━━━━━━━
📝 Condizioni richieste
• Cittadino registrato
• Comportamento civile
• Nessuna sospensione
• Conoscenza regole

━━━━━━━━━━━━━━━━━━
⚠️ Mancato rispetto = rifiuto automatico`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("INIZIA PATENTE")
      .setStyle(ButtonStyle.Primary)
  );

  await ch.send({ embeds: [embed], components: [row] });
});

// ================= INTERACTION =================
client.on("interactionCreate", async (interaction) => {
  try {

    // ================= START =================
    if (interaction.isButton() && interaction.customId === "start") {

      const member = interaction.member;

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("select")
          .setPlaceholder("Seleziona patente")
          .addOptions(
            Object.keys(RUOLI).map((k) => ({
              label: member.roles.cache.has(RUOLI[k])
                ? `Patente ${k} (GIÀ POSSEDUTA)`
                : `Patente ${k}`,
              value: k,
            }))
          )
      );

      return interaction.reply({
        content: "Seleziona patente:",
        components: [menu],
        flags: 64,
      });
    }

    // ================= SELECT =================
    if (interaction.isStringSelectMenu()) {

      const type = interaction.values[0];
      const member = interaction.member;

      if (member.roles.cache.has(RUOLI[type])) {
        return interaction.reply({
          content: "❌ Hai già questa patente",
          flags: 64,
        });
      }

      userData.set(interaction.user.id, { type });

      const modal = new ModalBuilder()
        .setCustomId("quiz")
        .setTitle("Quiz Patente");

      QUESTIONS[type].forEach((q, i) => {
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

      return interaction.showModal(modal);
    }

    // ================= QUIZ =================
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      const data = userData.get(interaction.user.id);
      if (!data) return;

      const answers = [];

      for (let i = 0; i < 5; i++) {
        answers.push(interaction.fields.getTextInputValue(`q${i}`));
      }

      data.answers = answers;
      data.waitingPhoto = true;

      return interaction.reply({
        content: `📸 Invia la foto nel canale <#${CANALE_FOTO}>`,
        flags: 64,
      });
    }

    // ================= BUTTON STAFF =================
    if (interaction.isButton()) {
      const [action, id] = interaction.customId.split("_");
      if (!pending.has(id)) return;

      const modal = new ModalBuilder()
        .setCustomId(`motivo_${action}_${id}`)
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

      const [, action, id] = interaction.customId.split("_");
      const req = pending.get(id);
      if (!req) return;

      const reason = interaction.fields.getTextInputValue("reason");

      const member = await interaction.guild.members.fetch(req.userId).catch(() => null);

      const status = action === "accetta" ? "APPROVATA" : "RIFIUTATA";

      const staff = await client.channels.fetch(CANALE_STAFF);
      const old = await staff.messages.fetch(req.messageId).catch(() => {});
      if (old) await old.delete();

      const qa = req.answers
        .map((a, i) => `**${QUESTIONS[req.type][i]}**\n➡️ ${a}`)
        .join("\n\n");

      // LOG STAFF
      const log = new EmbedBuilder()
        .setTitle("📋 ESITO PATENTE")
        .setColor("#a81900")
        .addFields(
          { name: "Utente", value: `<@${req.userId}>` },
          { name: "Patente", value: req.type },
          { name: "Esito", value: status },
          { name: "Domande", value: qa.slice(0, 1024) },
          { name: "Motivo", value: reason }
        );

      await staff.send({ embeds: [log] });

      // RUOLO
      if (member && action === "accetta") {
        await member.roles.add(RUOLI[req.type]);
      }

      // DM UTENTE
      const user = await client.users.fetch(req.userId);

      await user.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`📄 PATENTE ${status}`)
            .setColor(action === "accetta" ? "Green" : "Red")
            .addFields(
              { name: "Patente", value: req.type },
              { name: "Motivo", value: reason }
            ),
        ],
      }).catch(() => {});

      pending.delete(id);

      return interaction.reply({
        content: "✔ Fatto",
        flags: 64,
      });
    }

  } catch (err) {
    console.log(err);
  }
});

// ================= FOTO FIX =================
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.waitingPhoto) return;

  const okChannel =
    msg.channel.id === CANALE_FOTO ||
    msg.channel.isThread?.() ||
    msg.channel.parentId === CANALE_FOTO;

  if (!okChannel) return;

  const attachment = msg.attachments.first();
  if (!attachment) return;

  const id = msg.author.id + Date.now();

  pending.set(id, {
    userId: msg.author.id,
    type: data.type,
    answers: data.answers,
    photo: attachment.url,
  });

  userData.delete(msg.author.id);

  const staff = await client.channels.fetch(CANALE_STAFF);

  const qa = data.answers
    .map((a, i) => `**${QUESTIONS[data.type][i]}**\n➡️ ${a}`)
    .join("\n\n");

  const embed = new EmbedBuilder()
    .setTitle("📄 NUOVA RICHIESTA PATENTE")
    .setColor("#a81900")
    .addFields(
      { name: "Utente", value: `<@${msg.author.id}>` },
      { name: "Patente", value: data.type },
      { name: "Domande & Risposte", value: qa.slice(0, 1024) }
    )
    .setImage(attachment.url);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`accetta_${id}`).setLabel("ACCETTA").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`rifiuta_${id}`).setLabel("RIFIUTA").setStyle(ButtonStyle.Danger)
  );

  const sent = await staff.send({ embeds: [embed], components: [row] });

  pending.set(id, { ...pending.get(id), messageId: sent.id });
});

client.login(process.env.TOKEN);
