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

// ================= CLIENT =================
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

// ================= DESCRIZIONE =================
const DESCRIPTION = `
•  🏛️ Dipartimento Trasporti — __Sud Italy RP__

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

• Essere un __cittadino__ registrato e approvato  
• Avere un __comportamento civile__  
• Non essere __sospeso__  
• Conoscere le norme di circolazione  

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto comporterà il rifiuto automatico.
`;

// ================= DOMANDE =================
const QUESTIONS = {
  A: [
    "Casco obbligatorio in moto?",
    "Fari accesi anche di giorno?",
    "Rallentare in curva?",
    "Guanti obbligatori?",
    "Frenata su bagnato aumenta?"
  ],
  B: [
    "Cintura sempre obbligatoria?",
    "Limite urbano 50 km/h?",
    "Sorpasso con linea continua?",
    "Serve distanza di sicurezza?",
    "Specchietti obbligatori?"
  ],
  CD: [
    "Limite camion in città?",
    "Cosa fai al rosso?",
    "Precedenza incroci?",
    "Quando usi anabbaglianti?",
    "Ambulanza come comportarsi?"
  ]
};

// ================= READY =================
client.once("ready", async () => {
  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("#0B1F3A")
    .setDescription(DESCRIPTION);

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
            {
              label: member.roles.cache.has(RUOLI.A) ? "A (GIÀ)" : "Patente A",
              value: "A"
            },
            {
              label: member.roles.cache.has(RUOLI.B) ? "B (GIÀ)" : "Patente B",
              value: "B"
            },
            {
              label: member.roles.cache.has(RUOLI.CD) ? "C-D (GIÀ)" : "Patente C-D",
              value: "CD"
            }
          ])
      );

      return interaction.reply({
        content: "Seleziona patente:",
        components: [menu],
        ephemeral: true
      });
    }

    // ================= SELECT =================
    if (interaction.isStringSelectMenu()) {

      const type = interaction.values[0];

      if (interaction.member.roles.cache.has(RUOLI[type])) {
        return interaction.reply({
          content: "❌ Hai già questa patente",
          ephemeral: true
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
              .setLabel(q)
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

      const answers = QUESTIONS[data.type].map((_, i) =>
        interaction.fields.getTextInputValue(`q${i}`)
      );

      userData.set(interaction.user.id, {
        ...data,
        answers,
        waitingPhoto: true
      });

      return interaction.reply({
        content: `📸 Invia la foto nel canale <#${CANALE_FOTO}>`,
        ephemeral: true
      });
    }

    // ================= BOTTONI =================
    if (interaction.isButton()) {

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
    }

    // ================= FINAL =================
    if (interaction.isModalSubmit() && interaction.customId.startsWith("motivo_")) {

      const [, action, id] = interaction.customId.split("_");
      const req = pending.get(id);
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
          { name: "📋 Domande & Risposte", value: qa.slice(0, 1024) },
          { name: "📝 Motivo", value: reason },
          { name: "👮 Staff", value: `<@${interaction.user.id}>` }
        )
        .setImage(req.photo);

      const staff = await client.channels.fetch(CANALE_STAFF);

      await staff.send({ embeds: [embed] });

      // ELIMINA RICHIESTA
      const old = await staff.messages.fetch(req.messageId).catch(() => null);
      if (old) await old.delete().catch(() => {});

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
        content: "✔ Completato",
        ephemeral: true
      });
    }

  } catch (err) {
    console.log(err);
  }
});

// ================= FOTO =================
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const isForum =
    msg.channel.isThread?.() &&
    msg.channel.parentId === CANALE_FOTO;

  const isChannel = msg.channel.id === CANALE_FOTO;

  if (!isForum && !isChannel) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.waitingPhoto) return;

  const att = msg.attachments.first();
  if (!att) return;

  const id = msg.author.id;

  const qa = data.answers
    .map((a, i) => `**${QUESTIONS[data.type][i]}**\n➡️ ${a}`)
    .join("\n\n");

  const embed = new EmbedBuilder()
    .setTitle("📄 NUOVA RICHIESTA PATENTE")
    .setColor("#a81900")
    .addFields(
      { name: "👤 Utente", value: `<@${id}>` },
      { name: "🚗 Patente", value: data.type },
      { name: "📋 Domande & Risposte", value: qa.slice(0, 1024) }
    )
    .setImage(att.url);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`accetta_${id}`).setLabel("ACCETTA").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`rifiuta_${id}`).setLabel("RIFIUTA").setStyle(ButtonStyle.Danger)
  );

  const staff = await client.channels.fetch(CANALE_STAFF);
  const sent = await staff.send({ embeds: [embed], components: [row] });

  pending.set(id, {
    userId: id,
    type: data.type,
    answers: data.answers,
    photo: att.url,
    messageId: sent.id
  });

  userData.delete(id);
});

client.login(process.env.TOKEN);
