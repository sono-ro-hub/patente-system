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
const quiz = require("./quiz"); // 🔴 FIX IMPORT MANCANTE

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
const CANALE_PAGAMENTI = "1494066451152240650"; // 🔴 FIX: METTI ID VERO

const OWNER_ID = "1416503148998033509";

// =========================
// MEMORY
// =========================
const userData = new Map();
let messageSent = false;

// =========================
// TESTO INFO (TUO ORIGINALE NON TOCCATO)
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
Permette di far guidare __camion__, __pullman__ o __autobus__, utili per il trasporto delle merci e delle persone.

━━━━━━━━━━━━━━━━━━
__📝Condizioni richieste__

• Essere un __cittadino__ registrato e approvato all’interno del server  
• Avere un __comportamento civile__ e rispettoso delle regole RP  
• Non essere __soggetto__ a __sospensioni__ o provvedimenti attivi  
• Dimostrare una __conoscenza adeguata__ delle norme di circolazione    

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto dei requisiti comporterà il rifiuto automatico della richiesta.`;

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
      ephemeral: true
    });
  }

  // SELECT
  if (interaction.isStringSelectMenu()) {

    const type = interaction.values[0];
    userData.set(interaction.user.id, { type, finished: false });

    const modal = new ModalBuilder()
      .setCustomId("quiz")
      .setTitle("Quiz Patente");

    quiz[type].forEach((q, i) => {
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

  // QUIZ SUBMIT
  if (interaction.isModalSubmit() && interaction.customId === "quiz") {

    const data = userData.get(interaction.user.id);

    data.answers = quiz[data.type].map((_, i) =>
      interaction.fields.getTextInputValue(`q${i}`)
    );

    data.finished = true;

    return interaction.reply({
      content:
"📸 Ora invia la foto del pagamento.\n\n👉 Apri il canale, clicca + e carica lo screenshot.",
      ephemeral: true
    });
  }

  // BOTTONI STAFF
  if (interaction.isButton()) {

    if (interaction.customId.startsWith("accetta_") || interaction.customId.startsWith("rifiuta_")) {

      const modal = new ModalBuilder()
        .setCustomId(`motivo_${interaction.customId}`)
        .setTitle("Motivo obbligatorio");

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
  }

  // MOTIVO + DM
  if (interaction.isModalSubmit() && interaction.customId.startsWith("motivo_")) {

    const action = interaction.customId.replace("motivo_", "");
    const userId = action.split("_")[1];
    const motivo = interaction.fields.getTextInputValue("reason");

    const guild = await client.guilds.fetch(interaction.guildId);
    const member = await guild.members.fetch(userId);

    const tipo = userData.get(userId)?.type;

    if (action.startsWith("accetta")) {

      await member.roles.add(tipo);
      await member.send(`✅ Patente APPROVATA\nMotivo: ${motivo}`);

    } else {

      await member.send(`❌ Patente RIFIUTATA\nMotivo: ${motivo}`);
    }

    return interaction.reply({ content: "Operazione completata." });
  }
});

// =========================
// FOTO + LOG + DELETE FIX
// =========================
client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;
  if (msg.channel.id !== CANALE_RICHIESTE) return;

  const data = userData.get(msg.author.id);
  const attachment = msg.attachments.first();

  if (!attachment || !data || !data.finished) {
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

  let qa = "";
  quiz[data.type].forEach((q, i) => {
    qa += `**${q}**\n${data.answers[i]}\n\n`;
  });

  const image = attachment.url;

  const staffEmbed = new EmbedBuilder()
    .setColor("Green")
    .setTitle(`NUOVA PATENTE ${paymentId}`)
    .setDescription(`👤 <@${msg.author.id}>\n📅 ${date}\n\n${qa}`)
    .setImage(image);

  const publicEmbed = new EmbedBuilder()
    .setColor("DarkBlue")
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
