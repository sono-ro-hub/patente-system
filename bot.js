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

// NUOVO CANALE FOTO (pagamenti patente)
const CANALE_FOTO = "1494066451152240650";

const RUOLI = {
  A: "1493609058438090773",
  B: "1493609132996165633",
  CD: "1493609213086142645"
};

// ================= MEMORY =================
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

// ================= READY =================
client.once("ready", async () => {

 console.log("BOT ONLINE");

 const ch=await client.channels.fetch(CANALE_RICHIESTE);

 const embed=new EmbedBuilder()
 .setColor("Blue")
 .setDescription(`
• 🏛️ Dipartimento Trasporti — __Sud Italy RP__

Se desideri metterti alla guida in modo regolare, dovrai ottenere una licenza ufficiale rilasciata dal dipartimento.
 `);

 const row=new ActionRowBuilder().addComponents(
 new ButtonBuilder()
 .setCustomId("start")
 .setLabel("MODULI PATENTE")
 .setStyle(ButtonStyle.Primary)
 );

 await ch.send({
 embeds:[embed],
 components:[row]
 });

});

// ================= INTERAZIONI =================
client.on("interactionCreate", async interaction=>{

try{

// START
if(interaction.isButton() && interaction.customId==="start"){

const menu=new ActionRowBuilder().addComponents(
new StringSelectMenuBuilder()
.setCustomId("select")
.setPlaceholder("Seleziona patente")
.addOptions([
{label:"Patente A",value:"A"},
{label:"Patente B",value:"B"},
{label:"Patente C-D",value:"CD"}
])
);

return interaction.reply({
content:"Seleziona patente:",
components:[menu],
ephemeral:true
});

}

// SELECT QUIZ
if(interaction.isStringSelectMenu()){

const type=interaction.values[0];

userData.set(interaction.user.id,{
type,
answers:[]
});

const modal=new ModalBuilder()
.setCustomId("quiz")
.setTitle("Quiz Patente");

QUESTIONS[type].forEach((q,i)=>{

modal.addComponents(
new ActionRowBuilder().addComponents(
new TextInputBuilder()
.setCustomId(`q${i}`)
.setLabel(q)
.setStyle(TextInputStyle.Short)
.setRequired(true)
)
);

});

return interaction.showModal(modal);

}

// QUIZ SUBMIT
if(interaction.isModalSubmit() && interaction.customId==="quiz"){

const data=userData.get(interaction.user.id);
if(!data) return;

data.answers=QUESTIONS[data.type].map((q,i)=>
interaction.fields.getTextInputValue(`q${i}`)
);

data.waitingPhoto=true;

return interaction.reply({
content:"📸 Ora vai nel canale <#1494066451152240650> e clicca il + per allegare la foto del pagamento.",
ephemeral:true
});

}

// STAFF BUTTON
if(
interaction.isButton() &&
(
interaction.customId.startsWith("accetta_") ||
interaction.customId.startsWith("rifiuta_")
)
){

const modal=new ModalBuilder()
.setCustomId(`motivo_${interaction.customId}`)
.setTitle("Motivo obbligatorio");

modal.addComponents(
new ActionRowBuilder().addComponents(
new TextInputBuilder()
.setCustomId("reason")
.setLabel("Scrivi il motivo")
.setStyle(TextInputStyle.Paragraph)
.setRequired(true)
)
);

return interaction.showModal(modal);

}

// STAFF RESULT
if(
interaction.isModalSubmit() &&
interaction.customId.startsWith("motivo_")
){

const full=interaction.customId.replace("motivo_","");
const[action,id]=full.split("_");

const req=pending.get(id);
if(!req) return;

const reason=interaction.fields.getTextInputValue("reason");

const member=await interaction.guild.members.fetch(id)
.catch(()=>null);

const qa=req.answers.map((a,i)=>
`**${QUESTIONS[req.type][i]}** → ${a}`
).join("\n");

const decision=
action==="accetta"
?"APPROVATA"
:"RIFIUTATA";

const embed=new EmbedBuilder()
.setTitle(`📄 PATENTE ${decision}`)
.setColor(
decision==="APPROVATA"
?"Green"
:"Red"
)
.addFields(
{name:"👤 Utente",value:`<@${id}>`},
{name:"🚗 Patente",value:req.type},
{name:"📋 Quiz",value:qa},
{name:"📝 Motivo",value:reason},
{name:"👮 Staff",value:`<@${interaction.user.id}>`}
)
.setImage("attachment://pagamento.png");

const staff=
await client.channels.fetch(CANALE_STAFF);

await staff.send({
embeds:[embed],
files:[
{
attachment:req.photo,
name:"pagamento.png"
}
]
});

if(member){

if(action==="accetta"){
await member.roles.add(
RUOLI[req.type]
);
await member.send("✅ Patente approvata");
}else{
await member.send("❌ Patente rifiutata");
}

}

pending.delete(id);

return interaction.reply({
content:"✔ Fatto",
ephemeral:true
});

}

}catch(err){
console.log(err);
}

});

// ================= FOTO =================
client.on("messageCreate", async msg=>{

try{

if(msg.author.bot) return;

// FOTO SOLO NEL CANALE FOTO
if(msg.channel.id!==CANALE_FOTO) return;

const data=userData.get(msg.author.id);

if(!data || !data.waitingPhoto) return;

const attachment=
msg.attachments.first();

if(!attachment) return;

// scarica foto PRIMA di delete
const res=await fetch(attachment.url);
const buffer=
Buffer.from(await res.arrayBuffer());

try{
await msg.delete();
}catch{}

pending.set(
msg.author.id,
{
type:data.type,
answers:data.answers,
photo:buffer
}
);

userData.delete(msg.author.id);

const staff=
await client.channels.fetch(CANALE_STAFF);

const embed=
new EmbedBuilder()
.setTitle("📄 NUOVA RICHIESTA PATENTE")
.setDescription(`<@${msg.author.id}>`)
.addFields(
{name:"🚗 Patente",value:data.type},
{name:"📸 Stato",value:"Foto ricevuta ✔"}
)
.setImage("attachment://pagamento.png");

const row=
new ActionRowBuilder()
.addComponents(

new ButtonBuilder()
.setCustomId(`accetta_${msg.author.id}`)
.setLabel("ACCETTA")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId(`rifiuta_${msg.author.id}`)
.setLabel("RIFIUTA")
.setStyle(ButtonStyle.Danger)

);

await staff.send({
embeds:[embed],
components:[row],
files:[
{
attachment:buffer,
name:"pagamento.png"
}
]
});

}catch(err){
console.log(err);
}

});

// ================= LOGIN =================
client.login(process.env.TOKEN);
