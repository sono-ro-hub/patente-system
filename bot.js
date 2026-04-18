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
app.get("/", (req, res) => res.send("Bot online ✔"));
app.listen(process.env.PORT || 3000);

// ================= CLIENT =================
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

// ================= STORAGE =================
const userData = new Map();
const pending = new Map();

// ================= DOMANDE =================
const QUESTIONS = {
  A: [
    "Casco obbligatorio quando si guida una moto?",
    "I fari devono essere accesi anche di giorno?",
    "In curva bisogna rallentare prima di entrare?",
    "È obbligatorio usare guanti?",
    "Su strada bagnata la frenata aumenta?"
  ],
  B: [
    "La cintura è obbligatoria sempre?",
    "Il limite in città è 50 km/h?",
    "Si può sorpassare con linea continua?",
    "Serve distanza di sicurezza?",
    "Gli specchietti sono obbligatori?"
  ],
  CD: [
    "Limite camion in città?",
    "Cosa fai al semaforo rosso?",
    "Chi ha precedenza agli incroci?",
    "Quando usi le luci anabbaglianti?",
    "Come comportarsi con ambulanza?"
  ]
};

// ================= READY =================
client.once("ready", async () => {

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("#0B1F3A")
    .setDescription(`•  🏛️ Dipartimento Trasporti — __Sud Italy RP__

Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale rilasciata dal dipartimento.

━━━━━━━━━━━━━━━━━━
📋Tipi di patente
__🅰️ Patente A__
Consente la guida di __motocicli__ e veicoli a due ruote.
__🅱️ Patente B__
Permette di guidare __autovetture__ e veicoli leggeri.
__🅲 Patente C-D__
Permette di guidare __camion__, __pullman__ o __autobus__.

━━━━━━━━━━━━━━━━━━
📝Condizioni richieste

• Essere un __cittadino__ registrato  
• Comportamento civile  
• Nessuna sospensione attiva  
• Conoscenza codice strada  

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto comporterà rifiuto automatico.`);

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
          .addOptions([
            { label: "Patente A", value: "A" },
            { label: "Patente B", value: "B" },
            { label: "Patente C-D", value: "CD" }
          ])
      );

      return interaction.reply({
        content: "Seleziona patente:",
        components: [menu],
        flags: 64
      });
    }

    // ================= SELECT =================
    if (interaction.isStringSelectMenu()) {

      const type = interaction.values[0];

      if (interaction.member.roles.cache.has(RUOLI[type])) {
        return interaction.reply({
          content: "❌ Hai già questa patente",
          flags: 64
        });
      }

      userData.set(interaction.user.id, {
        type,
        answers: [],
        waitingPhoto: false
      });

      const modal = new ModalBuilder()
        .setCustomId("quiz")
        .setTitle("Quiz Patente");

      const q = QUESTIONS[type];

      for (let i = 0; i < 5; i++) {
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId(`q${i}`)
              .setLabel(q[i].slice(0, 45))
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
      }

      return interaction.showModal(modal);
    }

    // ================= QUIZ =================
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      const data = userData.get(interaction.user.id);
      if (!data) return;

      data.answers = [];

      for (let i = 0; i < 5; i++) {
        data.answers.push(
          interaction.fields.getTextInputValue(`q${i}`)
        );
      }

      data.waitingPhoto = true;

      return interaction.reply({
        content: `📸 Invia la foto nel canale <#${CANALE_FOTO}>`,
        flags: 64
      });
    }

  } catch (err) {
    console.log(err);
  }
});

// ================= FOTO FIX (IMPORTANTISSIMO) =================
client.on("messageCreate", async (msg) => {
  try {

    if (msg.author.bot) return;

    if (msg.channel.id !== CANALE_FOTO) return;

    const data = userData.get(msg.author.id);

    if (!data || !data.waitingPhoto) return;

    const attachment = msg.attachments.first();
    if (!attachment) return;

    const id = msg.author.id + Date.now();

    pending.set(id, {
      userId: msg.author.id,
      type: data.type,
      answers: data.answers,
      photo: attachment.url,
      messageId: null
    });

    userData.delete(msg.author.id);

    const qa = data.answers
      .map((a, i) => `**${QUESTIONS[data.type][i]}**\n➡️ ${a}`)
      .join("\n\n");

    const staff = await client.channels.fetch(CANALE_STAFF);

    const embed = new EmbedBuilder()
      .setTitle("📄 NUOVA RICHIESTA PATENTE")
      .setColor("#a81900")
      .addFields(
        { name: "👤 Utente", value: `<@${msg.author.id}>` },
        { name: "🚗 Patente", value: data.type },
        { name: "📋 Domande & Risposte", value: qa.slice(0, 1024) },
        { name: "📸 Stato", value: "In attesa decisione" }
      )
      .setImage(attachment.url);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`accetta_${id}`).setLabel("ACCETTA").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`rifiuta_${id}`).setLabel("RIFIUTA").setStyle(ButtonStyle.Danger)
    );

    const sent = await staff.send({ embeds: [embed], components: [row] });

    pending.get(id).messageId = sent.id;

  } catch (err) {
    console.log(err);
  }
});

// ================= ACCETTA / RIFIUTA =================
client.on("interactionCreate", async (interaction) => {
  try {

    if (!interaction.isButton()) return;

    const [action, id] = interaction.customId.split("_");

    const req = pending.get(id);
    if (!req) return;

    const modal = new ModalBuilder()
      .setCustomId(`motivo_${action}_${id}`)
      .setTitle("Motivo decisione");

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

  } catch (err) {
    console.log(err);
  }
});

// ================= FINAL =================
client.on("interactionCreate", async (interaction) => {
  try {

    if (!interaction.isModalSubmit()) return;
    if (!interaction.customId.startsWith("motivo_")) return;

    const [, action, id] = interaction.customId.split("_");

    const req = pending.get(id);
    if (!req) return;

    const reason = interaction.fields.getTextInputValue("reason");

    const member = await interaction.guild.members.fetch(req.userId).catch(() => null);

    const status = action === "accetta" ? "ACCETTATA" : "RIFIUTATA";

    const qa = req.answers
      .map((a, i) => `**${QUESTIONS[req.type][i]}**\n➡️ ${a}`)
      .join("\n\n");

    const log = new EmbedBuilder()
      .setTitle("📄 ESITO PATENTE")
      .setColor("#a81900")
      .addFields(
        { name: "👤 Utente", value: `<@${req.userId}>` },
        { name: "🚗 Patente", value: req.type },
        { name: "📊 Stato", value: status },
        { name: "📋 Domande & Risposte", value: qa.slice(0, 1024) },
        { name: "📝 Motivo", value: reason },
        { name: "👮 Staff", value: `<@${interaction.user.id}>` }
      )
      .setImage(req.photo);

    const staff = await client.channels.fetch(CANALE_STAFF);

    const msg = await staff.send({ embeds: [log] });

    // ❌ elimina richiesta vecchia
    const old = await staff.messages.fetch(req.messageId).catch(() => {});
    if (old) await old.delete();

    // ROLE
    if (member && action === "accetta") {
      await member.roles.add(RUOLI[req.type]);
    }

    // DM
    const user = await client.users.fetch(req.userId);

    await user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(`📄 PATENTE ${status}`)
          .setColor(action === "accetta" ? "Green" : "Red")
          .addFields(
            { name: "🚗 Patente", value: req.type },
            { name: "📝 Motivo", value: reason }
          )
      ]
    }).catch(() => {});

    pending.delete(id);

    return interaction.reply({
      content: "✔ Fatto",
      flags: 64
    });

  } catch (err) {
    console.log(err);
  }
});

client.login(process.env.TOKEN);
