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
client.once("ready", async()=>{  

const ch=await client.channels.fetch(CANALE_RICHIESTE);  

const embed=new EmbedBuilder()  
.setColor("#0B1F3A")  
.setTitle("🏛️ Dipartimento Trasporti")  
.setDescription("Sistema patenti attivo — Sud Italy RP");  

const row=new ActionRowBuilder().addComponents(  
new ButtonBuilder()  
.setCustomId("start")  
.setLabel("MODULI PATENTE")  
.setStyle(ButtonStyle.Primary)  
);  

await ch.send({embeds:[embed],components:[row]});  

});  

// ================= INTERACTION =================  
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

// SELECT  
if(interaction.isStringSelectMenu()){  

const type=interaction.values[0];  

userData.set(interaction.user.id,{  
type,  
answers:[]  
});  

const modal=new ModalBuilder()  
.setCustomId("quiz")  
.setTitle("Quiz Patente");  

modal.addComponents(  
...QUESTIONS[type].map((q,i)=>  
new ActionRowBuilder().addComponents(  
new TextInputBuilder()  
.setCustomId(`q${i}`)  
.setLabel(q)  
.setStyle(TextInputStyle.Short)  
.setRequired(true)  
)  
)  
);  

return interaction.showModal(modal);  
}  

// QUIZ  
if(interaction.isModalSubmit() && interaction.customId==="quiz"){  

const data=userData.get(interaction.user.id);  
if(!data) return;  

data.answers = QUESTIONS[data.type].map((_,i)=>  
interaction.fields.getTextInputValue(`q${i}`)  
);  

data.waitingPhoto=true;  

return interaction.reply({  
content:"📸 Invia la foto nel canale foto.",  
ephemeral:true  
});  
}  

// BOTTONI  
if(interaction.isButton()){  

const [action,userId]=interaction.customId.split("_");  
if(!action || !userId) return;  

const modal=new ModalBuilder()  
.setCustomId(`motivo_${action}_${userId}`)  
.setTitle("Motivo decisione");  

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

// FINAL DECISION  
if(interaction.isModalSubmit() && interaction.customId.startsWith("motivo_")){  

const [,action,userId]=interaction.customId.split("_");  

const req=pending.get(userId);  

if(!req){  
return interaction.reply({  
content:"❌ Richiesta non trovata",  
ephemeral:true  
});  
}  

const reason=interaction.fields.getTextInputValue("reason");  

const member=await interaction.guild.members.fetch(userId).catch(()=>null);  

const decision=action==="accetta"?"APPROVATA":"RIFIUTATA";  

// ===== EMBED LOG STAFF =====  
const logEmbed=new EmbedBuilder()  
.setTitle(`📄 PATENTE ${decision}`)  
.setColor(decision==="APPROVATA"?"Green":"Red")  
.addFields(  
{name:"👤 Utente",value:`<@${userId}>`},  
{name:"🚗 Tipo",value:req.type},  
{name:"📝 Motivo",value:reason},  
{name:"👮 Staff",value:`<@${interaction.user.id}>`}  
);  

const staffChannel=await client.channels.fetch(CANALE_STAFF);  

await staffChannel.send({embeds:[logEmbed]});  

// ===== RUOLO =====  
if(member && action==="accetta"){  
await member.roles.add(RUOLI[req.type]);  
}  

// ===== DM UTENTE =====  
const userEmbed=new EmbedBuilder()  
.setTitle(`📄 Patente ${decision}`)  
.setColor(decision==="APPROVATA"?"Green":"Red")  
.setDescription(`La tua richiesta è stata **${decision}**`)  
.addFields(  
{name:"🚗 Patente",value:req.type},  
{name:"📝 Motivo",value:reason}  
);  

const user=await client.users.fetch(userId);  
await user.send({embeds:[userEmbed]}).catch(()=>{});  

// ===== CLEAN =====  
pending.delete(userId);  

return interaction.reply({  
content:"✔ Completato",  
ephemeral:true  
});  
}  

}catch(err){  
console.log(err);  
}  

});  

client.login(process.env.TOKEN);
