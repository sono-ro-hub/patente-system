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
    "I fari devono essere accesi anche di giorno?",
    "In curva bisogna rallentare prima di entrare?",
    "Su strada bagnata la frenata aumenta?",
    "È obbligatorio usare i guanti?",
  ],
  B: [
    "La cintura è obbligatoria sempre?",
    "Il limite in città è 50 km/h?",
    "Serve distanza di sicurezza?",
    "Si può usare il telefono senza vivavoce?",
    "I bambini devono usare seggiolino?",
  ],
  CD: [
    "Limite camion in città?",
    "Cosa fai al semaforo rosso?",
    "Chi ha precedenza agli incroci?",
    "Quando usi anabbaglianti?",
    "Come comportarsi con ambulanza?",
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
🅰️ Patente A → moto  
🅱️ Patente B → auto  
🅲 Patente C-D → camion/bus  

━━━━━━━━━━━━━━━━━━
📝 Requisiti
• cittadino registrato  
• comportamento corretto  
• nessuna sospensione  
• conoscenza regole  

━━━━━━━━━━━━━━━━━━
⚠️ Violazioni = rifiuto automatico`);

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
        content: `📸 Vai nel canale <#${CANALE_FOTO}> e invia la foto pagamento.`,
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

      const log = new EmbedBuilder()
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

      const msg = await staff.send({ embeds: [log] });

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

// ================= FOTO =================
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (msg.channel.id !== CANALE_FOTO) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.waitingPhoto) return;

  const att = msg.attachments.first();
  if (!att) return;

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
      { name: "📋 Q&A", value: qa.slice(0, 1024) }
    )
    .setImage(att.url);

  const id = msg.author.id;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`accetta_${id}`).setLabel("ACCETTA").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`rifiuta_${id}`).setLabel("RIFIUTA").setStyle(ButtonStyle.Danger)
  );

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
