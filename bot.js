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

// ================= QUIZ =================
const QUIZ = {
  A: [
    "Il casco è obbligatorio quando guidi la moto?",
    "I fari devono essere accesi anche di giorno?",
    "In curva bisogna rallentare prima di entrarci?",
    "Posso guidare senza guanti?",
    "Su strada bagnata la frenata è più lunga?",
    "Il freno anteriore è più potente?",
    "È vietato superare a destra?",
    "Pneumatici lisci sono sicuri?",
    "La freccia è obbligatoria?",
    "Il casco deve essere allacciato?",
    "Posso guidare contromano?",
    "Il limite urbano è 50 km/h?",
    "Si può guidare senza patente?",
    "Con pioggia aumenta distanza?",
    "Il clacson è solo per emergenza?"
  ],

  B: [
    "Il casco è obbligatorio in auto?",
    "In città il limite è 50 km/h?",
    "La cintura va sempre allacciata?",
    "Posso sorpassare con linea continua?",
    "La distanza di sicurezza serve?",
    "Il semaforo rosso significa stop?",
    "Posso usare telefono senza vivavoce?",
    "I fari vanno accesi di notte?",
    "La frenata sul bagnato è più lunga?",
    "I bambini devono usare seggiolini?",
    "La precedenza a destra vale sempre?",
    "Il parcheggio vietato è segnalato?",
    "Il sorpasso a sinistra è obbligatorio?",
    "Bisogna rispettare i limiti?",
    "Autostrada limite 130 km/h?"
  ],

  CD: [
    "Limite camion in città?",
    "Cosa fai al semaforo rosso?",
    "Chi ha precedenza agli incroci?",
    "Quando accendi anabbaglianti?",
    "Come comportarsi con ambulanza?",
    "Veicolo per più persone?",
    "Cos’è distanza sicurezza?",
    "Cos’è freno motore?",
    "Dove parcheggiano camion?",
    "Significato segnale camion?"
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
Permette di far guidare __camion__, __pullman__ o __autobus__.

━━━━━━━━━━━━━━━━━━
📝Condizioni richieste

• Essere un __cittadino__ registrato e approvato all’interno del server  
• Avere un __comportamento civile__ e rispettoso delle regole RP  
• Non essere __soggetto__ a __sospensioni__ o provvedimenti attivi  
• Dimostrare una __conoscenza adeguata__ delle norme di circolazione  

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto dei requisiti comporterà il rifiuto automatico della richiesta.`);

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
              label: member.roles.cache.has(RUOLI.A) ? "A (GIÀ)" : "Patente A",
              value: "A"
            },
            {
              label: member.roles.cache.has(RUOLI.B) ? "B (GIÀ)" : "Patente B",
              value: "B"
            },
            {
              label: member.roles.cache.has(RUOLI.CD) ? "CD (GIÀ)" : "Patente C-D",
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
        return interaction.reply({ content: "❌ già possiedi questa patente", flags: 64 });
      }

      const shuffled = QUIZ[type].sort(() => 0.5 - Math.random());

      userData.set(interaction.user.id, {
        type,
        step: 0,
        questions: shuffled,
        answers: []
      });

      return sendQuiz(interaction);
    }

    // ================= QUIZ =================
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      const data = userData.get(interaction.user.id);
      if (!data) return;

      const start = data.step * 5;

      for (let i = 0; i < 5; i++) {
        data.answers[start + i] =
          interaction.fields.getTextInputValue(`q${i}`);
      }

      data.step++;

      if (data.step * 5 >= data.questions.length) {

        data.waitingPhoto = true;

        return interaction.reply({
          content: `📸 invia la foto nel canale <#${CANALE_FOTO}>`,
          flags: 64
        });
      }

      return sendQuiz(interaction);
    }

  } catch (err) {
    console.log(err);
  }
});

// ================= FUNZIONE QUIZ =================
async function sendQuiz(interaction) {

  const data = userData.get(interaction.user.id);

  const start = data.step * 5;
  const questions = data.questions.slice(start, start + 5);

  const modal = new ModalBuilder()
    .setCustomId("quiz")
    .setTitle("Quiz Patente");

  questions.forEach((q, i) => {
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

  data.currentQuestions = questions;

  return interaction.showModal(modal);
}

// ================= FOTO =================
client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.waitingPhoto) return;

  const attachment = msg.attachments.first();
  if (!attachment) return;

  const id = msg.author.id + Date.now();

  const qa = data.answers
    .map((a, i) => `**${data.questions[i]}**\n➡️ ${a}`)
    .join("\n\n");

  pending.set(id, {
    userId: msg.author.id,
    type: data.type,
    answers: data.answers,
    questions: data.questions,
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
      { name: "📋 Quiz", value: qa.slice(0, 1024) }
    )
    .setImage(attachment.url);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`accetta_${id}`).setLabel("ACCETTA").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`rifiuta_${id}`).setLabel("RIFIUTA").setStyle(ButtonStyle.Danger)
  );

  const sent = await staff.send({ embeds: [embed], components: [row] });

  pending.get(id).messageId = sent.id;
});

// ================= DECISION =================
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
        .setLabel("Motivo")
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

  const staff = await client.channels.fetch(CANALE_STAFF);

  const log = new EmbedBuilder()
    .setTitle("📋 ESITO PATENTE")
    .setColor("#a81900")
    .addFields(
      { name: "👤 Utente", value: `<@${req.userId}>` },
      { name: "🚗 Patente", value: req.type },
      { name: "📊 Stato", value: status },
      { name: "📝 Motivo", value: reason }
    )
    .setImage(req.photo);

  await staff.send({ embeds: [log] });

  const old = await staff.messages.fetch(req.messageId).catch(() => null);
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

  return interaction.reply({ content: "✔ fatto", flags: 64 });
});

client.login(process.env.TOKEN);
