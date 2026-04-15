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
const quiz = require("./quiz");

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
// PAYMENT FILE
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
const CANALE_PAGAMENTI = "1494066451152240650";

const OWNER_ID = "1416503148998033509";

// =========================
// MEMORY
// =========================
const userData = new Map();

// =========================
// READY
// =========================
client.once("ready", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("Blue")
    .setDescription("🏛️ Dipartimento Trasporti RP");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("Richiedi patente")
      .setStyle(ButtonStyle.Primary)
  );

  await ch.send({ embeds: [embed], components: [row] });
});

// =========================
// INTERAZIONI
// =========================
client.on("interactionCreate", async (interaction) => {

  if (interaction.isButton() && interaction.customId === "start") {

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select")
        .setPlaceholder("Seleziona patente")
        .addOptions([
          { label: "A", value: "A" },
          { label: "B", value: "B" },
          { label: "CD", value: "CD" }
        ])
    );

    return interaction.reply({
      content: "Seleziona patente:",
      components: [menu],
      ephemeral: true
    });
  }

  if (interaction.isStringSelectMenu()) {

    const type = interaction.values[0];
    userData.set(interaction.user.id, { type });

    const modal = new ModalBuilder()
      .setCustomId("quiz")
      .setTitle("Quiz Patente");

    quiz[type].slice(0, 5).forEach((q, i) => {
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

  if (interaction.isModalSubmit() && interaction.customId === "quiz") {

    const data = userData.get(interaction.user.id);

    data.answers = quiz[data.type].slice(0, 5).map((_, i) =>
      interaction.fields.getTextInputValue(`q${i}`)
    );

    data.finished = true;

    return interaction.reply({
      content:
`📸 Invia ora la foto del pagamento nel canale.

👉 Come fare:
• clicca "+"
• scegli immagine
• invia screenshot

⚠️ obbligatorio per completare la richiesta`,
      ephemeral: true
    });
  }
});

// =========================
// FOTO + LOG + DELETE
// =========================
client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;
  if (msg.channel.id !== CANALE_RICHIESTE) return;

  const data = userData.get(msg.author.id);
  const attachment = msg.attachments.first();

  if (!attachment || !data || !data.finished) return msg.delete().catch(() => {});

  const staff = await client.channels.fetch(CANALE_STAFF);
  const publicChannel = await client.channels.fetch(CANALE_PAGAMENTI);

  const date = new Date().toLocaleString("it-IT", {
    timeZone: "Europe/Rome"
  });

  const paymentId = `#${String(paymentData.counter).padStart(4, "0")}`;
  paymentData.counter++;
  fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(paymentData, null, 2));

  const image = attachment.url;

  // =========================
  // STAFF LOG COMPLETO
  // =========================
  const staffEmbed = new EmbedBuilder()
    .setColor("Green")
    .setTitle(`NUOVA PATENTE ${paymentId}`)
    .setDescription(`👤 <@${msg.author.id}>\n📅 ${date}`)
    .setImage(image);

  // =========================
  // PUBBLICO (SOLO ESSENZIALE)
  // =========================
  const publicEmbed = new EmbedBuilder()
    .setColor("DarkBlue")
    .setTitle("PATENTE RILASCIATA")
    .setDescription(`👤 <@${msg.author.id}>\n📅 ${date}`)
    .setImage(image);

  await staff.send({ embeds: [staffEmbed] });
  await publicChannel.send({ embeds: [publicEmbed] });

  await msg.reply("✅ Pagamento registrato e inviato.");

  setTimeout(() => msg.delete().catch(() => {}), 2000);
});

// =========================
// LOGIN
// =========================
client.login(process.env.TOKEN);
