require("http").createServer((req,res)=>{
  res.end("ok");
}).listen(process.env.PORT || 3000);

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

const config = require("./config.json");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const userData = new Map();
let sent = false;

// =========================
// INFO PATENTE (TUO TESTO)
// =========================
const INFO = `
•  🏛️ Dipartimento Trasporti — __Sud Italy RP__

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
⚠️ Il mancato rispetto dei requisiti comporterà il rifiuto automatico della richiesta.
`;

// =========================
// QUIZ COMPLETO
// =========================
const quiz = {
A: [
"Casco obbligatorio?",
"Fari anche di giorno?",
"Rallentare in curva?",
"Contromano permesso?",
"Frenata su bagnato?",
"Clacson solo emergenza?",
"Patente obbligatoria?",
"Uso cellulare guida?",
"Distanza sicurezza?",
"Superare a destra?",
"Pneumatici lisci?",
"Casco sempre allacciato?",
"Limite città 50?",
"Pioggia aumenta distanza?",
"Guida senza patente?"
],
B: [
"Cintura obbligatoria?",
"Semaforo rosso stop?",
"Cellulare senza vivavoce?",
"Fari notte obbligatori?",
"Limite autostrada 130?",
"Sorpasso linea continua?",
"Bambini seggiolino?",
"Precedenza a destra?",
"Parcheggio vietato?",
"Distanza sicurezza?",
"Guida senza patente?",
"Rispetto limiti?"
],
CD: [
"Limite camion città?",
"Ambulanza priorità?",
"Freno motore cos’è?",
"Dove parcheggi camion?",
"Segnale camion?",
"Distanza sicurezza?",
"Anabbaglianti quando?",
"Carico massimo?"
]
};

// =========================
// READY (NO SPAM)
// =========================
client.once("ready", async () => {
console.log("BOT PRONTO");

const ch = await client.channels.fetch(config.canaleRichieste);

if (sent) return;

const embed = new EmbedBuilder()
.setColor("Blue")
.setTitle("📄 RICHIESTA PATENTE")
.setDescription("Premi il bottone per iniziare");

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId("start")
.setLabel("Richiedi patente")
.setStyle(ButtonStyle.Primary)
);

await ch.send({ embeds:[embed], components:[row] });

sent = true;
});

// =========================
// INTERACTIONS
// =========================
client.on("interactionCreate", async (interaction)=>{

try {

// START
if(interaction.isButton() && interaction.customId==="start"){

const menu = new ActionRowBuilder().addComponents(
new StringSelectMenuBuilder()
.setCustomId("select")
.setPlaceholder("Seleziona patente")
.addOptions([
{label:"Patente A", value:"A"},
{label:"Patente B", value:"B"},
{label:"Patente C-D", value:"CD"}
])
);

return interaction.reply({
embeds:[new EmbedBuilder().setColor("Blue").setDescription(INFO)],
components:[menu],
ephemeral:true
});
}

// SELECT
if(interaction.isStringSelectMenu()){

const type = interaction.values[0];

userData.set(interaction.user.id,{
type,
step:0,
answers:[]
});

return sendQuiz(interaction);
}

// QUIZ
if(interaction.isModalSubmit() && interaction.customId.startsWith("quiz_")){

const data = userData.get(interaction.user.id);

const values = Object.values(interaction.fields.fields).map(f=>f.value);

data.answers.push(...values);
data.step += 5;

if(data.step >= quiz[data.type].length){

const btn = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId("pay")
.setLabel("Carica pagamento 3000")
.setStyle(ButtonStyle.Success)
);

return interaction.reply({
content:"Ora invia pagamento",
components:[btn],
ephemeral:true
});
}

return sendQuiz(interaction);
}

// PAY
if(interaction.isButton() && interaction.customId==="pay"){

const modal = new ModalBuilder()
.setCustomId("payment")
.setTitle("Pagamento");

const input = new TextInputBuilder()
.setCustomId("info")
.setLabel("Scrivi: fatto pagamento 3000")
.setStyle(TextInputStyle.Short)
.setRequired(true);

modal.addComponents(new ActionRowBuilder().addComponents(input));

return interaction.showModal(modal);
}

// PAYMENT (UPLOAD FILE CORRETTO)
if(interaction.isModalSubmit() && interaction.customId==="payment"){

const data = userData.get(interaction.user.id);

const attachment = interaction.attachments?.first?.() || null;

const staff = await client.channels.fetch(config.canaleStaff);

const embed = new EmbedBuilder()
.setColor("Blue")
.setTitle("NUOVA PATENTE")
.setDescription(`
👤 <@${interaction.user.id}>
Tipo: ${data.type}

Risposte:
${data.answers.join("\n")}
`)
.setImage(attachment?.url || null);

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId(`accetta_${interaction.user.id}`)
.setLabel("ACCETTA")
.setStyle(ButtonStyle.Success),
new ButtonBuilder()
.setCustomId(`rifiuta_${interaction.user.id}`)
.setLabel("RIFIUTA")
.setStyle(ButtonStyle.Danger)
);

await staff.send({embeds:[embed], components:[row]});

return interaction.reply({content:"Inviato staff", ephemeral:true});
}

// STAFF MOTIVO
if(interaction.isButton() && (interaction.customId.startsWith("accetta_") || interaction.customId.startsWith("rifiuta_"))){

const modal = new ModalBuilder()
.setCustomId(`reason_${interaction.customId}`)
.setTitle("Motivo obbligatorio");

const input = new TextInputBuilder()
.setCustomId("reason")
.setLabel("Motivo decisione")
.setStyle(TextInputStyle.Paragraph)
.setRequired(true);

modal.addComponents(new ActionRowBuilder().addComponents(input));

return interaction.showModal(modal);
}

// MOTIVO FINAL
if(interaction.isModalSubmit() && interaction.customId.startsWith("reason_")){

const [_, action, userId] = interaction.customId.split("_");

const guild = await client.guilds.fetch(config.guildId);
const member = await guild.members.fetch(userId).catch(()=>null);

const reason = interaction.fields.getTextInputValue("reason");

if(member && action==="accetta"){
await member.roles.add(config.patenteRoleId);
}

return interaction.reply({
content:`${action.toUpperCase()} \nMotivo: ${reason}`,
ephemeral:true
});
}

} catch(err){
console.log(err);
}
});

// =========================
// QUIZ FUNCTION
// =========================
function sendQuiz(interaction){

const data = userData.get(interaction.user.id);

const domande = quiz[data.type].slice(data.step, data.step+5);

const modal = new ModalBuilder()
.setCustomId(`quiz_${interaction.user.id}_${data.step}`)
.setTitle("Quiz Patente");

domande.forEach((q,i)=>{
modal.addComponents(
new ActionRowBuilder().addComponents(
new TextInputBuilder()
.setCustomId("q"+i)
.setLabel(q)
.setStyle(TextInputStyle.Short)
.setRequired(true)
)
);
});

return interaction.showModal(modal);
}

client.login(process.env.TOKEN);
