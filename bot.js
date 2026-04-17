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

// ================= TESTO INFO =================
const INFO = `
📄INFORMAZIONI PATENTE📄
__**INFORMAZIONI PATENTE**__

***Ecco alcuni step per fare la patente in maniera corretta***

**1) Inviare il quiz su MODULI-PATENTE e attendere lo staff***

**2) Inviare 3k in game a Lessimanuardi123 e caricare la foto su PAGAMENTI PATENTE***

**3) Guidare in sicurezza e rispettare le FDO (multa 1k senza patente)**

━━━━━━━━━━━━━━━━━━

🏛️ Dipartimento Trasporti — Sud Italy RP

━━━━━━━━━━━━━━━━━━
📋 Tipi di patente
🅰️ Moto
🅱️ Auto
🅲 Camion / Bus

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

// ================= INTERACTION =================
client.on("interactionCreate", async (interaction) => {
  try {

    // START
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

    // QUIZ (5 DOMANDE)
    if (interaction.isStringSelectMenu() && interaction.customId === "select") {

      const type = interaction.values[0];

      userData.set(interaction.user.id, {
        type,
        waitingPayment: false
      });

      const questions = [
        "Hai letto il regolamento?",
        "Il casco è obbligatorio?",
        "Il semaforo rosso è stop?",
        "Rispetti i limiti di velocità?",
        "Conosci le regole RP?"
      ];

      const modal = new ModalBuilder()
        .setCustomId("quiz")
        .setTitle("Quiz Patente");

      questions.forEach((q, i) => {
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId(`q${i + 1}`)
              .setLabel(q)
              .setStyle(TextInputStyle.Short)
          )
        );
      });

      return interaction.showModal(modal);
    }

    // QUIZ SUBMIT
    if (interaction.isModalSubmit() && interaction.customId === "quiz") {

      userData.set(interaction.user.id, {
        ...userData.get(interaction.user.id),
        waitingPayment: true
      });

      return interaction.reply({
        content: "✔️ Quiz completato!\nOra premi il bottone per inviare il pagamento.",
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("pay")
              .setLabel("💳 Invia Pagamento")
              .setStyle(ButtonStyle.Success)
          )
        ],
        ephemeral: true
      });
    }

    // BOTTONE PAGAMENTO
    if (interaction.isButton() && interaction.customId === "pay") {

      userData.set(interaction.user.id, {
        ...userData.get(interaction.user.id),
        waitingPayment: true
      });

      return interaction.reply({
        content: "📸 Ora carica la foto qui (clicca + e invia immagine).",
        ephemeral: true
      });
    }

  } catch (err) {
    console.log(err);
  }
});

// ================= FOTO UPLOAD =================
client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.waitingPayment) return;

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

// ================= STAFF DECISION =================
client.on("interactionCreate", async (interaction) => {
  try {

    if (!interaction.isButton()) return;

    if (
      interaction.customId.startsWith("accetta_") ||
      interaction.customId.startsWith("rifiuta_")
    ) {

      const modal = new ModalBuilder()
        .setCustomId(`motivo_${interaction.customId}`)
        .setTitle("Motivo decisione");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("Scrivi il motivo")
            .setStyle(TextInputStyle.Paragraph)
        )
      );

      return interaction.showModal(modal);
    }

  } catch (err) {
    console.log(err);
  }
});

// ================= MOTIVO STAFF =================
client.on("interactionCreate", async (interaction) => {
  try {

    if (!interaction.isModalSubmit()) return;
    if (!interaction.customId.startsWith("motivo_")) return;

    const action = interaction.customId.replace("motivo_", "");
    const id = action.split("_")[1];
    const reason = interaction.fields.getTextInputValue("reason");

    const member = await interaction.guild.members.fetch(id);
    const data = userData.get(id);

    if (!data) return;

    if (action.startsWith("accetta")) {
      await member.roles.add(RUOLI[data.type]);
      await member.send(`✅ Patente APPROVATA\nMotivo: ${reason}`);
    } else {
      await member.send(`❌ Patente RIFIUTATA\nMotivo: ${reason}`);
    }

    return interaction.reply({ content: "✔️ Fatto", ephemeral: true });

  } catch (err) {
    console.log(err);
  }
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
