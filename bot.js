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

// ================= READY =================
client.once("ready", async () => {
  console.log("BOT ONLINE");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("Blue")
    .setDescription("• 🏛️ Dipartimento Trasporti — __Sud Italy RP__");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("MODULI PATENTE")
      .setStyle(ButtonStyle.Primary)
  );

  await ch.send({
    embeds: [embed],
    components: [row]
  });
});

// ================= READY EXTRA (QUELLO CHE HAI CHIESTO TU) =================
client.once("ready", async () => {
  console.log("BOT ONLINE");

  const ch = await client.channels.fetch(CANALE_RICHIESTE);

  const embed = new EmbedBuilder()
    .setColor("#87CEFA")
    .setDescription(`•  🏛️ Dipartimento Trasporti — __Sud Italy RP__

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

**📄INFORMAZIONI PATENTE📄**
__**INFORMAZIONI PATENTE**__

***Ecco alcuni step per fare la patente in maniera corretta***

**1) Inviare il quiz per la patente che volete fare e attendere che lo staff member lo corregga***

**2) Inviare 3k in game all'id Lessimanuardi123 e inviare la foto su PAGAMENTI PATENTE e attendere che lo staff member applichi la tipologia di patente desiderata***

**3) Invitiamo tutti a fare la patente per viaggiare in maniera sicura e in maniera indipendente, Il consiglio che possiamo è quando vi ferma un agente delle FDO per una controllo dovete fornire il nome discord e per vedere se avete la tipologia di patente per la quale state usando il veicolo se vi vedranno senza patente dovrete pagare __**1k di multa**__`
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("MODULI PATENTE")
      .setStyle(ButtonStyle.Primary)
  );

  await ch.send({
    embeds: [embed],
    components: [row]
  });
});

// ================= INTERACTION =================
client.on("interactionCreate", async interaction => {
try{

if(interaction.isButton() &&
interaction.customId==="start"){

const menu=
new ActionRowBuilder().addComponents(
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

if(interaction.isStringSelectMenu()){

const type=interaction.values[0];

userData.set(interaction.user.id,{
type,
answers:[]
});

const modal=
new ModalBuilder()
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

if(interaction.isModalSubmit() && interaction.customId==="quiz"){

const data=userData.get(interaction.user.id);
if(!data) return;

data.answers=QUESTIONS[data.type].map((q,i)=>
interaction.fields.getTextInputValue(`q${i}`)
);

data.waitingPhoto=true;

return interaction.reply({
content:`📸 Vai nel canale <#1494066451152240650> e clicca il + per allegare la foto del pagamento.`,
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

if(msg.channel.id!==CANALE_FOTO) return;

const data=userData.get(msg.author.id);
if(!data || !data.waitingPhoto) return;

const attachment=msg.attachments.first();
if(!attachment) return;

const res=await fetch(attachment.url);
const buffer=Buffer.from(await res.arrayBuffer());

pending.set(msg.author.id,{
type:data.type,
answers:data.answers,
photo:buffer
});

userData.delete(msg.author.id);

const qa=data.answers.map((a,i)=>
`**${QUESTIONS[data.type][i]}**\n${a}`
).join("\n\n");

const embed=new EmbedBuilder()
.setTitle("📄 NUOVA RICHIESTA PATENTE")
.setDescription(`<@${msg.author.id}>`)
.addFields(
{name:"🚗 Patente",value:data.type},
{name:"📋 Domande e Risposte",value:qa.slice(0,1024)},
{name:"📸 Stato",value:"Foto ricevuta ✔"}
)
.setImage("attachment://pagamento.png");

const row=new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId(`accetta_${msg.author.id}`)
.setLabel("ACCETTA")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId(`rifiuta_${msg.author.id}`)
.setLabel("RIFIUTA")
.setStyle(ButtonStyle.Danger)
);

const staff=await client.channels.fetch(CANALE_STAFF);

await staff.send({
embeds:[embed],
components:[row],
files:[{attachment:buffer,name:"pagamento.png"}]
});

}catch(err){
console.log(err);
}
});

client.login(process.env.TOKEN);
