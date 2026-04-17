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

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

const userData = new Map();

// ================= KEEP ALIVE =================
const http = require("http");
http.createServer((req, res) => {
  res.end("Bot attivo");
}).listen(process.env.PORT || 3000);

// ================= INFO =================
const INFO = `
🏛️ Dipartimento Trasporti — Sud Italy RP

Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale rilasciata dal dipartimento.

━━━━━━━━━━━━━━━━━━
📋 Tipi di patente
🅰️ Patente A → Moto
🅱️ Patente B → Auto
🅲 Patente C-D → Camion / Bus

━━━━━━━━━━━━━━━━━━
📝 Requisiti
• cittadino registrato
• comportamento civile
• no sospensioni
• conoscenza regole RP

━━━━━━━━━━━━━━━━━━
⚠️ Rifiuto automatico se non rispetti i requisiti
`;

// ================= READY =================
client.once("ready", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("Blue")
    .setDescription(INFO);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("MODULI PATENTE")
      .setStyle(ButtonStyle.Primary)
  );

  await ch.send({ embeds: [embed], components: [row] });
});

// ================= DOMANDE ORIGINALI =================
const QUIZ = {
  A: [
    "Il casco è obbligatorio quando guidi la moto?",
    "È vietato superare a destra?",
    "Il limite urbano è 50 km/h?",
    "Il casco deve essere allacciato?",
    "La freccia è obbligatoria?"
  ],
  B: [
    "La cintura va sempre allacciata?",
    "Il semaforo rosso significa stop?",
    "I bambini devono usare seggiolini?",
    "Bisogna rispettare i limiti?",
    "La distanza di sicurezza serve?"
  ],
  CD: [
    "Cosa fai al semaforo rosso?",
    "Chi ha precedenza agli incroci?",
    "Cos’è distanza sicurezza?",
    "Dove parcheggiano i camion?",
    "Come comportarsi con ambulanza?"
  ]
};

// ================= START =================
client.on("interactionCreate", async (interaction) => {
  try {

    if (interaction.isButton() && interaction.customId === "start") {

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
        content: "Seleziona la patente:",
        components: [menu],
        ephemeral: true
      });
    }

    // ================= QUIZ =================
    if (interaction.isStringSelectMenu() && interaction.customId === "select") {

      const type = interaction.values[0];

      userData.set(interaction.user.id, {
        type,
        paymentMode: false
      });

      const questions = QUIZ[type];

      const modal = new ModalBuilder()
        .setCustomId("quiz")
        .setTitle("Quiz Patente");

      questions.forEach((q, i) => {
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId(`q${i + 1}`)
              .setLabel(q.slice(0, 45))
              .setStyle(TextInputStyle.Short)
          )
        );
      });

      return interaction.showModal(modal);
    }

    // ================= QUIZ DONE =================
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      userData.set(interaction.user.id, {
        ...userData.get(interaction.user.id),
        paymentMode: true
      });

      return interaction.reply({
        content: "✔️ Quiz completato!\nOra invia il pagamento con il bottone.",
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("pay")
              .setLabel("💳 INVIA PAGAMENTO")
              .setStyle(ButtonStyle.Success)
          )
        ],
        ephemeral: true
      });
    }

    // ================= PAY BUTTON =================
    if (interaction.isButton() && interaction.customId === "pay") {

      userData.set(interaction.user.id, {
        ...userData.get(interaction.user.id),
        waitingUpload: true
      });

      return interaction.reply({
        content: "📸 Ora INVIA QUI la foto del pagamento usando il + (galleria Discord).",
        ephemeral: true
      });
    }

  } catch (err) {
    console.log(err);
  }
});

// ================= UPLOAD FOTO =================
client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;

  const data = userData.get(msg.author.id);

  if (!data || !data.waitingUpload) return;

  const img = msg.attachments.first();
  if (!img) return;

  const staff = await client.channels.fetch(CANALE_STAFF);

  const embed = new EmbedBuilder()
    .setTitle("💳 PAGAMENTO PATENTE")
    .setDescription(`<@${msg.author.id}>`)
    .setImage(img.url);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`accetta_${msg.author.id}`)
      .setLabel("ACCETTA")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`rifiuta_${msg.author.id}`)
      .setLabel("RIFIUTA")
      .setStyle(ButtonStyle.Danger)
  );

  await staff.send({ embeds: [embed], components: [row] });

  await msg.reply("✔️ Pagamento inviato allo staff");

  userData.delete(msg.author.id);
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
