// =========================
// KEEP ALIVE (RENDER)
// =========================
require("http").createServer((req, res) => {
  res.write("Bot attivo");
  res.end();
}).listen(3000);

// =========================
// IMPORT
// =========================
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
  SlashCommandBuilder
} = require("discord.js");

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
const GUILD_ID = "1484912853126221896";

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
// TESTO
// =========================
const INFO = `Richiedi patente cliccando il bottone sotto.`;

const INFO2 = `1) Fai il quiz  
2) Paga  
3) Invia foto pagamento`;

// =========================
// QUIZ
// =========================
const quiz = {
  A: ["Casco obbligatorio?", "Fari giorno?", "Curva?", "Senza patente?"],
  B: ["Cintura?", "Rosso?", "Telefono?", "Fari notte?"],
  CD: ["Limite camion?", "Rosso?", "Ambulanza?", "Freno motore?"]
};

// =========================
// READY
// =========================
client.once("ready", async () => {
  console.log("BOT PRONTO");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  if (!messageSent) {
    const embed = new EmbedBuilder().setColor("Blue").setDescription(INFO);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start")
        .setLabel("Richiedi patente")
        .setStyle(ButtonStyle.Primary)
    );

    await ch.send({ embeds: [embed], components: [row] });
    messageSent = true;
  }

  const guild = await client.guilds.fetch(GUILD_ID);

  await guild.commands.create(
    new SlashCommandBuilder()
      .setName("image")
      .setDescription("Invia una foto per lo staff")
  );
});

// =========================
// INTERACTIONS
// =========================
client.on("interactionCreate", async (interaction) => {

  try {

    // SLASH /image
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "image") {
        return interaction.reply({
          content: "📸 Invia una foto in questo canale (solo immagini)",
          ephemeral: true
        });
      }
    }

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
        embeds: [new EmbedBuilder().setColor("Blue").setDescription(INFO2)],
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
        .setTitle("Quiz");

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

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("carica_foto")
          .setLabel("📸 Carica foto pagamento")
          .setStyle(ButtonStyle.Success)
      );

      return interaction.reply({
        content: "✅ Quiz fatto!\n\nPremi il bottone qui sotto per caricare la foto.",
        components: [row],
        ephemeral: true
      });
    }

    // BOTTONE FOTO
    if (interaction.isButton() && interaction.customId === "carica_foto") {

      return interaction.reply({
        content:
          "📸 Ora fai così:\n\n" +
          "1) Premi ➕ in basso\n" +
          "2) Vai su Galleria\n" +
          "3) Scegli la foto\n" +
          "4) Invia qui nel canale",
        ephemeral: true
      });
    }

  } catch (e) {
    console.log(e);
  }
});

// =========================
// FOTO
// =========================
client.on("messageCreate", async (msg) => {

  if (msg.author.bot) return;
  if (msg.channel.id !== CANALE_RICHIESTE) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.finished) return;

  const attachment = msg.attachments.first();
  if (!attachment) return;

  // SOLO IMMAGINI
  if (!attachment.contentType?.startsWith("image/")) {
    return msg.reply("❌ Devi inviare una foto dalla galleria!");
  }

  const staff = await client.channels.fetch(CANALE_STAFF);

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("NUOVA PATENTE")
    .setDescription(`
👤 <@${msg.author.id}>
Tipo: ${data.type}

${data.answers.join("\n")}
`)
    .setImage(attachment.url);

  await staff.send({ embeds: [embed] });

  msg.reply("✅ Inviato allo staff!");
  userData.delete(msg.author.id);
});

// =========================
// LOGIN
// =========================
client.login(process.env.TOKEN);
