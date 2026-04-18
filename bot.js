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
  PermissionsBitField
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

• Essere un __cittadino__ registrato e approvato all’interno del server  
• Avere un __comportamento civile__ e rispettoso delle regole RP  
• Non essere __soggetto__ a sospensioni o provvedimenti attivi  
• Dimostrare una __conoscenza adeguata__ delle norme di circolazione  

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto comporterà il rifiuto automatico della richiesta.`);

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

      await interaction.deferReply({ flags: 64 });

      const member = interaction.member;

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("select")
          .setPlaceholder("Seleziona patente")
          .addOptions([
            {
              label: member.roles.cache.has(RUOLI.A) ? "Patente A (GIÀ)" : "Patente A",
              value: "A"
            },
            {
              label: member.roles.cache.has(RUOLI.B) ? "Patente B (GIÀ)" : "Patente B",
              value: "B"
            },
            {
              label: member.roles.cache.has(RUOLI.CD) ? "Patente C-D (GIÀ)" : "Patente C-D",
              value: "CD"
            }
          ])
      );

      return interaction.editReply({
        content: "Seleziona patente:",
        components: [menu]
      });
    }

    // ================= SELECT =================
    if (interaction.isStringSelectMenu()) {

      const type = interaction.values[0];
      const member = interaction.member;

      if (member.roles.cache.has(RUOLI[type])) {
        return interaction.reply({
          content: "❌ Hai già questa patente",
          flags: 64
        });
      }

      userData.set(interaction.user.id, { type });

      const q = QUESTIONS[type];

      const modal = new ModalBuilder()
        .setCustomId("quiz")
        .setTitle("Quiz Patente");

      const rows = [];

      for (let i = 0; i < 5; i++) {
        rows.push(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId(`q${i}`)
              .setLabel(q[i].slice(0, 45))
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
      }

      modal.addComponents(rows);

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
        content: `📸 Vai nel canale <#${CANALE_FOTO}> e invia la foto.`,
        flags: 64
      });
    }

  } catch (err) {
    console.log(err);
  }
});

// ================= FOTO (FORUM + CANALE) =================
client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;

  const isForum = msg.channel.isThread?.() || msg.channel.parent?.type === 15;

  if (!isForum && msg.channel.id !== CANALE_FOTO) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.waitingPhoto) return;

  const attachment = msg.attachments.first();
  if (!attachment) return;

  const id = msg.author.id + Date.now();

  const qa = data.answers
    .map((a, i) => `**${QUESTIONS[data.type][i]}**\n➡️ ${a}`)
    .join("\n\n");

  pending.set(id, {
    userId: msg.author.id,
    type: data.type,
    answers: data.answers,
    photo: attachment.url
  });

  userData.delete(msg.author.id);

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
});

// ================= MOTIVO =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.isButton()) return;

  const [action, id] = interaction.customId.split("_");
  const req = pending.get(id);
  if (!req) return;

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
});

// ================= FINAL =================
client.on("interactionCreate", async (interaction) => {

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
    .setTitle("📋 ESITO PATENTE")
    .setColor("#a81900")
    .addFields(
      { name: "👤 Utente", value: `<@${req.userId}>` },
      { name: "🚗 Patente", value: req.type },
      { name: "📊 Stato", value: status },
      { name: "🧾 Domande & Risposte", value: qa.slice(0, 1024) },
      { name: "📝 Motivo", value: reason },
      { name: "👮 Staff", value: `<@${interaction.user.id}>` }
    )
    .setImage(req.photo);

  const staff = await client.channels.fetch(CANALE_STAFF);

  await staff.send({ embeds: [log] });

  const old = await staff.messages.fetch(req.messageId).catch(() => {});
  if (old) await old.delete();

  if (member && action === "accetta") {
    await member.roles.add(RUOLI[req.type]);
  }

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
});

client.login(process.env.TOKEN);
      
