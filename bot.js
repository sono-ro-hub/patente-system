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

app.get("/", (req, res) => {
  res.send("Bot online");
});

app.listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages
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

// ================= READY =================
client.once("ready", async () => {

  console.log("BOT ONLINE");

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
Permette di guidare __camion__, __pullman__ o __autobus__.

━━━━━━━━━━━━━━━━━━
__📝Condizioni richieste__

• Essere un __cittadino__ registrato  
• Avere un __comportamento civile__  
• Non essere __sospeso__  
• Conoscere le norme di circolazione  

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto comporterà il rifiuto automatico.`);

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

    if (!member.roles.cache.has(RUOLI.A)) options.push({ label: "Patente A", value: "A" });
    if (!member.roles.cache.has(RUOLI.B)) options.push({ label: "Patente B", value: "B" });
    if (!member.roles.cache.has(RUOLI.CD)) options.push({ label: "Patente C-D", value: "CD" });

    if (options.length === 0) {
      return interaction.reply({
        content: "❌ Hai già tutte le patenti.",
        ephemeral: true
      });
    }

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select")
        .setPlaceholder("Seleziona patente")
        .addOptions(options)
    );

    return interaction.reply({
      content: "Seleziona patente:",
      components: [menu],
      ephemeral: true
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
      .setTitle("Quiz Patente");

    ["Domanda 1","Domanda 2","Domanda 3","Domanda 4","Domanda 5"]
    .forEach((q,i)=>{
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

    data.answers = [0,1,2,3,4].map(i =>
      interaction.fields.getTextInputValue(`q${i}`)
    );

    data.waitingPhoto = true;

    return interaction.reply({
      content: `📸 Invia la foto nel canale <#${CANALE_FOTO}>`,
      ephemeral: true
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

  const embed = new EmbedBuilder()
    .setTitle("📄 RICHIESTA PATENTE")
    .setDescription(`<@${msg.author.id}>`)
    .setImage(attachment.url);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`accetta_${id}`).setLabel("ACCETTA").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`rifiuta_${id}`).setLabel("RIFIUTA").setStyle(ButtonStyle.Danger)
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

  const [action,id] = interaction.customId.split("_");
  if (!pending.has(id)) return;

  const modal = new ModalBuilder()
    .setCustomId(`motivo_${action}_${id}`)
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

} catch (err) {
  console.log(err);
}
});

// ================= FINAL =================
client.on("interactionCreate", async interaction => {

try {

  if (!interaction.isModalSubmit()) return;
  if (!interaction.customId.startsWith("motivo_")) return;

  const [,action,id] = interaction.customId.split("_");
  const req = pending.get(id);
  if (!req) return;

  const reason = interaction.fields.getTextInputValue("reason");

  const member = await interaction.guild.members.fetch(req.userId).catch(()=>null);

  const now = new Date().toLocaleString("it-IT", {
    timeZone: "Europe/Rome"
  });

  const staffChannel = await client.channels.fetch(CANALE_STAFF);
  const msg = await staffChannel.messages.fetch(req.messageId);

  await msg.delete().catch(()=>{});

  if (member && action === "accetta") {
    await member.roles.add(RUOLI[req.type]);
  }

  const user = await client.users.fetch(req.userId);

  const embed = new EmbedBuilder()
    .setTitle(action === "accetta" ? "✅ PATENTE APPROVATA" : "❌ PATENTE RIFIUTATA")
    .setColor(action === "accetta" ? "Green" : "Red")
    .setDescription(`👤 <@${req.userId}>`)
    .addFields(
      { name: "🚗 Patente", value: req.type },
      { name: "👮 Staff", value: `<@${interaction.user.id}>` },
      { name: "📝 Motivo", value: reason },
      { name: "🕒 Data", value: now }
    )
    .setImage(req.photo);

  await user.send({ embeds: [embed] }).catch(()=>{});

  pending.delete(id);

  await interaction.reply({
    content: "✔ Fatto",
    ephemeral: true
  });

} catch (err) {
  console.log(err);
}
});

client.login(process.env.TOKEN);
