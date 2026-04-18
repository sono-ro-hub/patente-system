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
const CANALE_FOTO = "1494066451152240650";

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

const userData = new Map();
const pending = new Map();

require("http").createServer((req,res)=>res.end("OK"))
.listen(process.env.PORT || 3000);

// ================= DOMANDE =================
const QUESTIONS = {
A:[
"Il casco è obbligatorio quando guidi la moto?",
"I fari devono essere accesi anche di giorno?",
"In curva bisogna rallentare prima di entrarci?",
"Posso guidare senza guanti?",
"Su strada bagnata la frenata è più lunga?"
],
B:[
"Il casco è obbligatorio in auto?",
"In città il limite è 50 km/h?",
"La cintura va sempre allacciata?",
"Posso sorpassare con linea continua?",
"La distanza di sicurezza serve?"
],
CD:[
"Limite camion in città?",
"Cosa fai al semaforo rosso?",
"Chi ha precedenza agli incroci?",
"Quando accendi anabbaglianti?",
"Come comportarsi con ambulanza?"
]
};

// ================= SAFE REPLY =================
const safeReply = async (interaction, data) => {
  try {
    if (interaction.replied || interaction.deferred) {
      return await interaction.followUp(data);
    }
    return await interaction.reply(data);
  } catch (e) {
    console.log(e);
  }
};

// ================= READY =================
client.once("ready", async () => {

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("#87CEFA")
    .setDescription("Clicca per iniziare patente");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("MODULI PATENTE")
      .setStyle(ButtonStyle.Primary)
  );

  await ch.send({ embeds: [embed], components: [row] });
});

// ================= INTERACTION =================
client.on("interactionCreate", async interaction => {

try {

  if (!interaction.isRepliable()) return;

  // START
  if (interaction.isButton() && interaction.customId === "start") {

    const member = interaction.member;

    const options = [];

    if (!member.roles.cache.has(RUOLI.A)) {
      options.push({ label: "Patente A", value: "A" });
    }
    if (!member.roles.cache.has(RUOLI.B)) {
      options.push({ label: "Patente B", value: "B" });
    }
    if (!member.roles.cache.has(RUOLI.CD)) {
      options.push({ label: "Patente C-D", value: "CD" });
    }

    if (options.length === 0) {
      return safeReply(interaction, {
        content: "❌ Hai già tutte le patenti.",
        flags: 64
      });
    }

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select")
        .setPlaceholder("Seleziona patente")
        .addOptions(options)
    );

    return safeReply(interaction, {
      content: "Seleziona patente:",
      components: [menu],
      flags: 64
    });
  }

  // SELECT
  if (interaction.isStringSelectMenu()) {

    const type = interaction.values[0];

    userData.set(interaction.user.id, {
      type,
      answers: []
    });

    const modal = new ModalBuilder()
      .setCustomId("quiz")
      .setTitle("Quiz");

    QUESTIONS[type].forEach((q, i) => {
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

  // QUIZ
  if (interaction.isModalSubmit() && interaction.customId === "quiz") {

    const data = userData.get(interaction.user.id);
    if (!data) return;

    data.answers = QUESTIONS[data.type].map((_, i) =>
      interaction.fields.getTextInputValue(`q${i}`)
    );

    data.waitingPhoto = true;

    return safeReply(interaction, {
      content: `📸 Invia foto in <#${CANALE_FOTO}>`,
      flags: 64
    });
  }

} catch (err) {
  console.log(err);
}
});

// ================= FOTO =================
client.on("messageCreate", async msg => {

try {

  if (msg.author.bot) return;
  if (msg.channel.id !== CANALE_FOTO) return;

  const data = userData.get(msg.author.id);
  if (!data || !data.waitingPhoto) return;

  const attachment = msg.attachments.first();
  if (!attachment) return;

  const id = msg.author.id + Date.now();

  const qa = data.answers.map((a,i)=>
`• ${QUESTIONS[data.type][i]}
➜ ${a}`
  ).join("\n\n");

  const embed = new EmbedBuilder()
    .setTitle("📄 RICHIESTA PATENTE")
    .setDescription(`<@${msg.author.id}>`)
    .addFields({
      name: "📋 Quiz",
      value: qa
    })
    .setImage(attachment.url);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`accetta_${id}`)
      .setLabel("ACCETTA")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`rifiuta_${id}`)
      .setLabel("RIFIUTA")
      .setStyle(ButtonStyle.Danger)
  );

  const staff = await client.channels.fetch(CANALE_STAFF);

  const sent = await staff.send({
    embeds: [embed],
    components: [row]
  });

  pending.set(id, {
    userId: msg.author.id,
    type: data.type,
    answers: data.answers,
    photo: attachment.url,
    messageId: sent.id
  });

  userData.delete(msg.author.id);

} catch (err) {
  console.log(err);
}
});

// ================= BOTTONI =================
client.on("interactionCreate", async interaction => {

try {

  if (!interaction.isButton()) return;

  if (!interaction.customId.includes("_")) return;

  const [action, id] = interaction.customId.split("_");

  if (!pending.has(id)) return;

  const modal = new ModalBuilder()
    .setCustomId(`motivo_${action}_${id}`)
    .setTitle("Motivo");

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

} catch (err) {
  console.log(err);
}
});

// ================= FINAL =================
client.on("interactionCreate", async interaction => {

try {

  if (!interaction.isModalSubmit()) return;
  if (!interaction.customId.startsWith("motivo_")) return;

  const [, action, id] = interaction.customId.split("_");

  const req = pending.get(id);
  if (!req) return;

  const reason = interaction.fields.getTextInputValue("reason");

  const member = await interaction.guild.members.fetch(req.userId).catch(() => null);

  const now = new Date().toLocaleString("it-IT", {
    timeZone: "Europe/Rome"
  });

  const qa = req.answers.map((a,i)=>
`**${QUESTIONS[req.type][i]}**
${a}`
  ).join("\n\n");

  const embed = new EmbedBuilder()
    .setTitle(action === "accetta" ? "✅ APPROVATA" : "❌ RIFIUTATA")
    .setColor(action === "accetta" ? "Green" : "Red")
    .setDescription(`<@${req.userId}>`)
    .addFields(
      { name: "🚗 Patente", value: req.type },
      { name: "📋 Quiz", value: qa },
      { name: "👮 Staff", value: `<@${interaction.user.id}>` },
      { name: "📝 Motivo", value: reason },
      { name: "🕒 Data", value: now }
    )
    .setImage(req.photo);

  const staff = await client.channels.fetch(CANALE_STAFF);
  const msg = await staff.messages.fetch(req.messageId);

  await msg.edit({
    embeds: [embed],
    components: []
  });

  if (member && action === "accetta") {
    await member.roles.add(RUOLI[req.type]);
  }

  pending.delete(id);

  await interaction.reply({
    content: "✔ Fatto",
    flags: 64
  });

} catch (err) {
  console.log(err);
}
});

client.login(process.env.TOKEN);
