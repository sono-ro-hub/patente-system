// =========================
// KEEP ALIVE
// =========================
require("http").createServer((req, res) => {
  res.write("Bot attivo");
  res.end();
}).listen(3000);

// =========================
// IMPORT
// =========================
const fs = require("fs");

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

// =========================
// QUIZ IMPORT (OBBLIGATORIO FILE quiz.js)
// =========================
const quiz = require("./quiz");

// =========================
// PAYMENT JSON
// =========================
const PAYMENTS_FILE = "./payments.json";

let paymentData = { counter: 1 };

if (fs.existsSync(PAYMENTS_FILE)) {
  paymentData = JSON.parse(fs.readFileSync(PAYMENTS_FILE, "utf8"));
} else {
  fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(paymentData, null, 2));
}

// =========================
// CLIENT
// =========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =========================
// CONFIG
// =========================
const CANALE_RICHIESTE = "1493595963942768860";
const CANALE_STAFF = "1493597555760824503";
const CANALE_PAGAMENTI = "1494066451152240650"; // 🔴 METTI ID VERO

const OWNER_ID = "1416503148998033509";

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

// =========================
// MEMORY
// =========================
const userData = new Map();
let messageSent = false;

// =========================
// INFO
// =========================
const INFO = `•  🏛️ Dipartimento Trasporti — __Sud Italy RP__

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
__📝Condizioni richieste__

• Essere un __cittadino__ registrato  
• Comportamento civile  
• Nessuna sospensione  
• Conoscenza norme  

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto comporta rifiuto.`;

// =========================
// READY
// =========================
client.once("ready", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  if (!messageSent) {
    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setDescription(INFO);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start")
        .setLabel("Richiedi patente")
        .setStyle(ButtonStyle.Primary)
    );

    await ch.send({ embeds: [embed], components: [row] });
    messageSent = true;
  }
});

// =========================
// HELPERS QUIZ PAGINATO
// =========================
function getPage(type, page) {
  const list = quiz[type];
  const start = page * 5;
  return list.slice(start, start + 5);
}

// =========================
// INTERAZIONI
// =========================
client.on("interactionCreate", async (interaction) => {

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
      flags: 64
    });
  }

  // SELECT
  if (interaction.isStringSelectMenu()) {

    const type = interaction.values[0];

    userData.set(interaction.user.id, {
      type,
      page: 0,
      answers: []
    });

    const modal = new ModalBuilder()
      .setCustomId("quiz")
      .setTitle("Quiz Patente - Pagina 1");

    const page = getPage(type, 0);

    page.forEach((q, i) => {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(`q${i}`)
            .setLabel(q)
            .setStyle(TextInputStyle.Short)
        )
      );
    });

    return interaction.showModal(modal);
  }

  // QUIZ MULTI-PAGE
  if (interaction.isModalSubmit() && interaction.customId === "quiz") {

    const data = userData.get(interaction.user.id);

    const pageAnswers = quiz[data.type]
      .slice(data.page * 5, data.page * 5 + 5)
      .map((_, i) => interaction.fields.getTextInputValue(`q${i}`));

    data.answers.push(...pageAnswers);
    data.page++;

    const next = getPage(data.type, data.page);

    if (next.length === 0) {

      data.finished = true;

      return interaction.reply({
        content: "📸 Ora invia la foto del pagamento nel canale.",
        flags: 64
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("quiz")
      .setTitle(`Quiz Patente - Pagina ${data.page + 1}`);

    next.forEach((q, i) => {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(`q${i}`)
            .setLabel(q)
            .setStyle(TextInputStyle.Short)
        )
      );
    });

    return interaction.showModal(modal);
  }

  // BOTTONI STAFF
  if (interaction.isButton()) {

    if (interaction.customId.startsWith("accetta_") ||
        interaction.customId.startsWith("rifiuta_")) {

      const modal = new ModalBuilder()
        .setCustomId(`motivo_${interaction.customId}`)
        .setTitle("Motivo");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("Scrivi motivo")
            .setStyle(TextInputStyle.Paragraph)
        )
      );

      return interaction.showModal(modal);
    }
  }

  // MOTIVO + DM
  if (interaction.isModalSubmit() && interaction.customId.startsWith("motivo_")) {

    const action = interaction.customId.replace("motivo_", "");
    const userId = action.split("_")[1];

    const motivo = interaction.fields.getTextInputValue("reason");

    const guild = await client.guilds.fetch(interaction.guildId);
    const member = await guild.members.fetch(userId);

    const data = userData.get(userId);

    if (action.startsWith("accetta")) {
      await member.roles.add(RUOLI[data.type]);
      await member.send(`✅ Patente APPROVATA\nMotivo: ${motivo}`);
    } else {
      await member.send(`❌ Patente RIFIUTATA\nMotivo: ${motivo}`);
    }

    return interaction.reply({ content: "OK" });
  }
});

// =========================
// FOTO + LOG + PAGAMENTI
// =========================
client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;
  if (msg.channel.id !== CANALE_RICHIESTE) return;

  const data = userData.get(msg.author.id);
  const attachment = msg.attachments.first();

  if (!data || !data.finished || !attachment) {
    return msg.delete().catch(() => {});
  }

  const staff = await client.channels.fetch(CANALE_STAFF);
  const publicChannel = await client.channels.fetch(CANALE_PAGAMENTI);

  const date = new Date().toLocaleString("it-IT", {
    timeZone: "Europe/Rome"
  });

  const paymentId = `#${String(paymentData.counter).padStart(4, "0")}`;
  paymentData.counter++;

  fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(paymentData, null, 2));

  const image = attachment.url;

  const staffEmbed = new EmbedBuilder()
    .setTitle(`NUOVA PATENTE ${paymentId}`)
    .setDescription(`👤 <@${msg.author.id}>\n📅 ${date}`)
    .setImage(image);

  const publicEmbed = new EmbedBuilder()
    .setTitle("🏛️ RICEVUTA UFFICIALE")
    .setDescription(`👤 <@${msg.author.id}>\n📄 ${paymentId}\n📅 ${date}`)
    .setImage(image);

  await staff.send({ embeds: [staffEmbed] });
  await publicChannel.send({ embeds: [publicEmbed] });

  await msg.reply("✅ Pagamento inviato");

  setTimeout(() => msg.delete().catch(() => {}), 2000);
});

// =========================
// LOGIN
// =========================
client.login(process.env.TOKEN);
