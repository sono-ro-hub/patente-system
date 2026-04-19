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

// ================= SERVERS =================
const SERVERS = {
S1: {
GUILD_ID: "1484912853126221896",
CANALE_RICHIESTE: "1493595963942768860",
CANALE_STAFF: "1493597555760824503",
CANALE_FOTO: "1495160562097721634",
RUOLI: {
A: "1493609058438090773",
B: "1493609132996165633",
CD: "1493609213086142645"
}
},

S2: {
GUILD_ID: "1402407968879808656",
CANALE_RICHIESTE: "1495181447877886012",
CANALE_STAFF: "1442639604611026997",
CANALE_FOTO: "1495181979384025209",
RUOLI: {
A: "1448725161338470420",
B: "1448725504470552708",
C: "1448725713523048468"
}
}
};

// ================= UTILS =================
const userData = new Map();
const pending = new Map();

function getServer(guildId) {
return Object.values(SERVERS).find(s => s.GUILD_ID === guildId);
}

// ================= DESCRIZIONE ORIGINALE =================
const DESCRIPTION = `
•  🏛️ Dipartimento Trasporti — Sud Italy RP

Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale rilasciata dal dipartimento.

━━━━━━━━━━━━━━━━━━
📋 Tipi di patente

🅰️ Patente A
Consente la guida di motocicli e veicoli a due ruote.

🅱️ Patente B
Permette di guidare autovetture e veicoli leggeri.

🅲 Patente C-D
Permette di guidare camion, pullman o autobus.

━━━━━━━━━━━━━━━━━━
📝 Condizioni richieste

• Essere un cittadino registrato e approvato all’interno del server  
• Avere un comportamento civile e rispettoso delle regole RP  
• Non essere soggetto a sospensioni o provvedimenti attivi  
• Dimostrare una conoscenza adeguata delle norme di circolazione  

━━━━━━━━━━━━━━━━━━
⚠️ Il mancato rispetto comporterà il rifiuto automatico della richiesta.
`;

// ================= INFO PATENTE =================
const INFO_EMBED = new EmbedBuilder()
.setColor("#FFD700")
.setTitle("📄 INFORMAZIONI PATENTE 📄")
.setDescription(`
__**INFORMAZIONI PATENTE**__

***Ecco alcuni step per fare la patente in maniera corretta***

**1)** Inviare il quiz per la patente che volete fare e attendere la correzione dello staff

**2)** Inviare 3k in game all'id **Lessimanuardi123** e inviare la prova su **PAGAMENTI PATENTE**

**3)** Durante i controlli FDO dovete fornire il nome Discord per verifica patente.  
Senza patente → multa **1k**
`);

// ================= TABELLA BLU =================
const BLUE_TABLE = new EmbedBuilder()
.setColor("#1E90FF")
.setTitle("📘 REGOLAMENTO PATENTE")
.setDescription(`
🏛️ Dipartimento Trasporti — Sud Italy RP

━━━━━━━━━━━━━━━━━━
📋 TIPI DI PATENTE

🅰️ Patente A → Moto  
🅱️ Patente B → Auto  
🅲 Patente C-D → Mezzi pesanti  

━━━━━━━━━━━━━━━━━━
📝 REQUISITI

• Cittadinanza attiva  
• Comportamento RP corretto  
• Nessuna sospensione  
• Conoscenza codice stradale  

━━━━━━━━━━━━━━━━━━
⚠️ Violazioni = rifiuto automatico
`);

// ================= QUESTIONS =================
const QUESTIONS = {
A: ["Casco obbligatorio in moto?","Fari accesi anche di giorno?","Rallentare in curva?","Guanti obbligatori?","Frenata su bagnato aumenta?"],
B: ["Cintura sempre obbligatoria?","Limite urbano 50 km/h?","Sorpasso con linea continua?","Distanza di sicurezza?","Specchietti obbligatori?"],
CD: ["Limite camion in città?","Cosa fai al rosso?","Precedenza incroci?","Anabbaglianti quando?","Ambulanza comportamento?"]
};

// ================= READY =================
client.once("ready", async () => {

for (const server of Object.values(SERVERS)) {

  const ch = await client.channels.fetch(server.CANALE_RICHIESTE).catch(() => null);
  if (!ch) continue;

  await ch.send({ embeds: [INFO_EMBED] });
  await ch.send({ embeds: [BLUE_TABLE] });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("INIZIA PATENTE")
      .setStyle(ButtonStyle.Primary)
  );

  await ch.send({ embeds: [new EmbedBuilder().setDescription(DESCRIPTION)], components: [row] });
}
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
try {

const server = getServer(interaction.guild.id);
if (!server) return;

// ================= START =================
if (interaction.isButton() && interaction.customId === "start") {

await interaction.deferReply({ flags: 64 });

const member = interaction.member;

const menu = new ActionRowBuilder().addComponents(
new StringSelectMenuBuilder()
.setCustomId("select")
.setPlaceholder("Seleziona patente")
.addOptions([
{ label: member.roles.cache.has(server.RUOLI.A) ? "A (GIÀ)" : "Patente A", value: "A" },
{ label: member.roles.cache.has(server.RUOLI.B) ? "B (GIÀ)" : "Patente B", value: "B" },
{ label: member.roles.cache.has(server.RUOLI.CD) ? "C-D (GIÀ)" : "Patente C-D", value: "CD" }
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

if (interaction.member.roles.cache.has(server.RUOLI[type])) {
return interaction.reply({ content: "❌ Hai già questa patente", flags: 64 });
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

// ================= QUIZ =================
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
content: `📸 Invia la foto nel canale <#${server.CANALE_FOTO}>`,
flags: 64
});
}

// ================= MOTIVO =================
if (interaction.isButton()) {

const [action, id] = interaction.customId.split("_");
if (!action || !id) return;

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
}

} catch (err) {
console.log(err);
}
});

// ================= MESSAGE =================
client.on("messageCreate", async (msg) => {

if (msg.author.bot) return;

const server = getServer(msg.guild.id);
if (!server) return;

const isForum = msg.channel.isThread?.() && msg.channel.parentId === server.CANALE_FOTO;
const isChannel = msg.channel.id === server.CANALE_FOTO;

if (!isForum && !isChannel) return;

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
{ name: "📋 Q&A", value: qa.slice(0, 1024) }
)
.setImage(attachment.url);

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId(`accetta_${id}`).setLabel("ACCETTA").setStyle(ButtonStyle.Success),
new ButtonBuilder().setCustomId(`rifiuta_${id}`).setLabel("RIFIUTA").setStyle(ButtonStyle.Danger)
);

const staff = await client.channels.fetch(server.CANALE_STAFF).catch(() => null);
if (!staff) return;

const sent = await staff.send({ embeds: [embed], components: [row] });

pending.set(id, {
...data,
messageId: sent.id
});

userData.delete(id);
});

// ================= FINAL =================
client.on("interactionCreate", async (interaction) => {

if (!interaction.isModalSubmit()) return;
if (!interaction.customId.startsWith("motivo_")) return;

const server = getServer(interaction.guild.id);
if (!server) return;

const [, action, id] = interaction.customId.split("_");
const req = pending.get(id);
if (!req) return;

const reason = interaction.fields.getTextInputValue("reason");

const member = await interaction.guild.members.fetch(id).catch(() => null);

const status = action === "accetta" ? "ACCETTATA" : "RIFIUTATA";

const channel = await client.channels.fetch(server.CANALE_STAFF).catch(() => null);

if (channel && req.messageId) {
const msg = await channel.messages.fetch(req.messageId).catch(() => null);
if (msg) await msg.delete().catch(() => {});
}

if (member && action === "accetta") {
await member.roles.add(server.RUOLI[req.type]);
}

const user = await client.users.fetch(id);

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

if (!interaction.replied) {
await interaction.reply({ content: "✔ Completato", flags: 64 });
}
});

client.login(process.env.TOKEN);
