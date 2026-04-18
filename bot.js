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

// ================= CLIENT =================
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

// ================= DESCRIZIONE =================
const DESCRIPTION = `
•  🏛️ Dipartimento Trasporti — Sud Italy RP

Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale rilasciata dal dipartimento.

━━━━━━━━━━━━━━━━━━
📋Tipi di patente

🅰️ Patente A
Consente la guida di motocicli e veicoli a due ruote.

🅱️ Patente B
Permette di guidare autovetture e veicoli leggeri.

🅲 Patente C-D
Permette di guidare camion, pullman o autobus.

━━━━━━━━━━━━━━━━━━
📝Condizioni richieste

• Essere un cittadino registrato e approvato all’interno del server
• Avere un comportamento civile e rispettoso delle regole RP
• Non essere soggetto a sospensioni o provvedimenti attivi
• Dimostrare una conoscenza adeguata delle norme di circolazione

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto comporterà il rifiuto automatico della richiesta.
`;

// ================= DOMANDE =================
const QUESTIONS = {
A: [
"Casco obbligatorio in moto?",
"Fari accesi anche di giorno?",
"Rallentare in curva?",
"Guanti obbligatori?",
"Frenata su bagnato aumenta?"
],
B: [
"Cintura sempre obbligatoria?",
"Limite urbano 50 km/h?",
"Sorpasso con linea continua?",
"Serve distanza di sicurezza?",
"Specchietti obbligatori?"
],
CD: [
"Limite camion in città?",
"Cosa fai al rosso?",
"Precedenza incroci?",
"Quando usi anabbaglianti?",
"Ambulanza come comportarsi?"
]
};

// ================= READY =================
client.once("ready", async () => {
const ch = await client.channels.fetch(CANALE_RICHIESTE);

const embed = new EmbedBuilder()
.setColor("#0B1F3A")
.setDescription(DESCRIPTION);

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
          label: member.roles.cache.has(RUOLI.A) ? "A (GIÀ POSSEDUTA)" : "Patente A",
          value: "A"
        },
        {
          label: member.roles.cache.has(RUOLI.B) ? "B (GIÀ POSSEDUTA)" : "Patente B",
          value: "B"
        },
        {
          label: member.roles.cache.has(RUOLI.CD) ? "C-D (GIÀ POSSEDUTA)" : "Patente C-D",
          value: "CD"
        }
      ])
  );

  return interaction.editReply({
    content: "Seleziona patente:",
    components: [menu]
  });
}

if (interaction.isStringSelectMenu()) {
  const type = interaction.values[0];

  if (interaction.member.roles.cache.has(RUOLI[type])) {
    return interaction.reply({
      content: "❌ Hai già questa patente",
      flags: 64
    });
  }

  userData.set(interaction.user.id, { type });

  const modal = new ModalBuilder()
    .setCustomId("quiz")
    .setTitle("Quiz Patente");

  const q = QUESTIONS[type];

  for (let i = 0; i < 5; i++) {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(`q${i}`)
          .setLabel(q[i])
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );
  }

  return interaction.showModal(modal);
}

if (interaction.isModalSubmit() && interaction.customId === "quiz") {
  const data = userData.get(interaction.user.id);
  if (!data) return;

  const answers = [];
  for (let i = 0; i < 5; i++) {
    answers.push(interaction.fields.getTextInputValue(`q${i}`));
  }

  data.answers = answers;
  data.waitingPhoto = true;

  return interaction.reply({
    content: `📸 Invia la foto nel canale o forum <#${CANALE_FOTO}>`,
    flags: 64
  });
}

} catch (err) {
console.log(err);
}
});

// ================= FOTO =================
client.on("messageCreate", async (msg) => {
if (msg.author.bot) return;

const isForumThread =
msg.channel.isThread?.() &&
msg.channel.parentId === CANALE_FOTO;

const isNormalChannel =
msg.channel.id === CANALE_FOTO;

if (!isForumThread && !isNormalChannel) return;

const data = userData.get(msg.author.id);
if (!data || !data.waitingPhoto) return;

const attachment = msg.attachments.first();
if (!attachment) return;

const id = msg.author.id;

const qa = data.answers
.map((a, i) => `**${QUESTIONS[data.type][i]}**\n➡️ ${a}`)
.join("\n\n");

const embed = new EmbedBuilder()
.setTitle("📄 NUOVA RICHIESTA PATENTE")
.setColor("#a81900")
.addFields(
{ name: "👤 Utente", value: `<@${id}>` },
{ name: "🚗 Patente", value: data.type },
{ name: "📋 Domande & Risposte", value: qa.slice(0, 1024) }
)
.setImage(attachment.url);

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId(`accetta_${id}`).setLabel("ACCETTA").setStyle(ButtonStyle.Success),
new ButtonBuilder().setCustomId(`rifiuta_${id}`).setLabel("RIFIUTA").setStyle(ButtonStyle.Danger)
);

const staffChannel = await client.channels.fetch(CANALE_STAFF);

const sent = await staffChannel.send({
embeds: [embed],
components: [row]
});

pending.set(id, {
...data,
photo: attachment.url,
messageId: sent.id
});

userData.delete(id);
});

// ================= ACCETTA / RIFIUTA =================
client.on("interactionCreate", async (interaction) => {
if (!interaction.isButton()) return;

const [action, id] = interaction.customId.split("_");
const req = pending.get(id);
if (!req) return;

const modal = new ModalBuilder()
.setCustomId(`motivo_${action}_${id}`)
.setTitle("Motivo decisione");

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

const guild = interaction.guild;
const member = await guild.members.fetch(id).catch(() => null);

const status = action === "accetta" ? "ACCETTATA" : "RIFIUTATA";

const staff = await client.channels.fetch(CANALE_STAFF);

// ✅ FIX SICURO: elimina SEMPRE il modulo senza crash
try {
  const message = await staff.messages.fetch(req.messageId).catch(() => null);
  if (message) await message.delete().catch(() => null);
} catch (err) {
  console.log("Errore eliminazione modulo:", err);
}

if (member && action === "accetta") {
await member.roles.add(RUOLI[req.type]);
}

const user = await client.users.fetch(id);

await user.send({
embeds: [
new EmbedBuilder()
.setTitle(`📄 PATENTE ${status}`)
.setColor(action === "accetta" ? "Green" : "Red")
.addFields({
name: "🚗 Patente",
value: req.type
})
]
}).catch(() => {});

pending.delete(id);

if (!interaction.replied && !interaction.deferred) {
await interaction.reply({ content: "✔ Completato", flags: 64 });
} else {
await interaction.followUp({ content: "✔ Completato", flags: 64 });
}
});

client.login(process.env.TOKEN);
