import discord
from discord.ext import commands, tasks
from discord import app_commands
from datetime import datetime
from zoneinfo import ZoneInfo
from flask import Flask
import threading
import os
import traceback
import sqlite3
import urllib.request

# =========================
# TOKEN
# =========================
TOKEN = os.getenv("DISCORD_TOKEN")

if not TOKEN:
    print("⚠️ Token non trovato!")
    exit()

# =========================
# FLASK KEEP ALIVE
# =========================
app = Flask('')

@app.route('/')
def home():
    return "Bot attivo!"

def run_web():
    app.run(host='0.0.0.0', port=8080)

threading.Thread(target=run_web, daemon=True).start()

# =========================
# DATABASE
# =========================
conn = sqlite3.connect("recensioni.db")
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS recensioni (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utente TEXT,
    voto INTEGER
)
""")
conn.commit()

# =========================
# BOT
# =========================
intents = discord.Intents.default()
intents.members = True

bot = commands.Bot(command_prefix="/", intents=intents)
tree = bot.tree

# =========================
# CONFIG
# =========================
OWNER_ID = 1416503148998033509

WARN_ROLES = [1431782790361251940, 1426203184719724686]
BAN_ROLES = [1431782790361251940, 1426203184719724686]
STATUS_ROLES = [1402426264639246428, 1428439749651337266]

STATUS_IMAGE = "https://cdn.discordapp.com/attachments/1420059113462960229/1493384509327147188/IMG_5956.png"

# =========================
# UTILS
# =========================
def now_rome():
    return datetime.now(ZoneInfo("Europe/Rome"))

def format_time():
    return now_rome().strftime("%d/%m/%Y | %H:%M")

def has_perm(interaction, roles):
    if interaction.user.id == OWNER_ID:
        return True
    if not isinstance(interaction.user, discord.Member):
        return False
    return any(r.id in roles for r in interaction.user.roles)

def media_totale():
    cursor.execute("SELECT voto FROM recensioni")
    voti = [r[0] for r in cursor.fetchall()]
    if not voti:
        return 0
    return round(sum(voti) / len(voti) * 2, 1)

def stelle(voto):
    return "⭐" * voto

# =========================
# READY
# =========================
@bot.event
async def on_ready():
    await tree.sync()
    print(f"ONLINE {bot.user}")

# =========================
# RECENSIONE
# =========================
@tree.command(name="recensione", description="Crea una recensione utente")
@app_commands.describe(
    utente="Utente recensito",
    autore="Autore recensione",
    voto="Voto da 1 a 5",
    commento="Commento recensione"
)
async def recensione(interaction: discord.Interaction, utente: discord.Member, autore: discord.Member, voto: int, commento: str):

    await interaction.response.defer()

    if voto < 1 or voto > 5:
        return await interaction.followup.send("Voto 1-5", ephemeral=True)

    cursor.execute("INSERT INTO recensioni (utente, voto) VALUES (?, ?)", (utente.display_name, voto))
    conn.commit()

    if voto <= 2:
        color = discord.Color.red()
    elif voto == 3:
        color = discord.Color.gold()
    else:
        color = discord.Color.green()

    embed = discord.Embed(title="Recensione", color=color)

    embed.add_field(name="Utente", value=utente.mention, inline=False)
    embed.add_field(name="Autore", value=autore.mention, inline=False)
    embed.add_field(name="Voto", value=f"{stelle(voto)} ({voto}/5)", inline=False)
    embed.add_field(name="Commento", value=commento, inline=False)
    embed.add_field(name="Media", value=f"{media_totale()}/10", inline=False)

    embed.set_footer(text=f"Data: {format_time()}")

    await interaction.followup.send(embed=embed)

# =========================
# WARN
# =========================
@tree.command(name="warn", description="Warn utente (STAFF ONLY)")
async def warn(interaction: discord.Interaction, utente: str, motivo: str, scadenza: str, effettuato_da: str, provvedimento: str, firma: str):

    if not has_perm(interaction, WARN_ROLES):
        return await interaction.response.send_message("❌ No permessi", ephemeral=True)

    embed = discord.Embed(title="🚨 WARN", color=discord.Color.red())
    embed.add_field(name="Utente", value=utente, inline=False)
    embed.add_field(name="Motivo", value=motivo, inline=False)
    embed.add_field(name="Scadenza", value=scadenza, inline=False)
    embed.add_field(name="Effettuato da", value=effettuato_da, inline=False)
    embed.add_field(name="Provvedimento", value=provvedimento, inline=False)
    embed.add_field(name="Firma", value=firma, inline=False)
    embed.set_footer(text=f"Data: {format_time()}")

    await interaction.response.send_message(embed=embed)

# =========================
# BAN
# =========================
@tree.command(name="ban", description="Ban utente (STAFF ONLY)")
async def ban(interaction: discord.Interaction, utente: str, motivo: str, durata: str, firma: str):

    if not has_perm(interaction, BAN_ROLES):
        return await interaction.response.send_message("❌ No permessi", ephemeral=True)

    embed = discord.Embed(title="⛔ BAN", color=discord.Color.dark_red())
    embed.add_field(name="Utente", value=utente, inline=False)
    embed.add_field(name="Motivo", value=motivo, inline=False)
    embed.add_field(name="Durata", value=durata, inline=False)
    embed.add_field(name="Firma", value=firma, inline=False)
    embed.set_footer(text=f"Data: {format_time()}")

    await interaction.response.send_message(embed=embed)

# =========================
# TOP
# =========================
@tree.command(name="top", description="Classifica recensioni utenti")
async def top(interaction: discord.Interaction):

    await interaction.response.defer()

    cursor.execute("SELECT utente, voto FROM recensioni")
    rows = cursor.fetchall()

    if not rows:
        return await interaction.followup.send("Nessuna recensione")

    stats = {}
    for u, v in rows:
        stats.setdefault(u, []).append(v)

    ranking = sorted(
        [(u, sum(v)/len(v)) for u, v in stats.items()],
        key=lambda x: x[1],
        reverse=True
    )

    testo = "\n".join(
        f"{i+1}. {u} - {round(m*2,1)}/10"
        for i, (u, m) in enumerate(ranking)
    )

    embed = discord.Embed(
        title="🏆 TOP UTENTI",
        description=testo,
        color=discord.Color.blue()
    )

    await interaction.followup.send(embed=embed)

# =========================
# STATUS (UNICO COMANDO)
# =========================
@tree.command(name="status", description="Stato server ON/OFF")
@app_commands.describe(stato="Scrivi on oppure off")
async def status(interaction: discord.Interaction, stato: str):

    if not has_perm(interaction, STATUS_ROLES):
        return await interaction.response.send_message("❌ No permessi", ephemeral=True)

    stato = stato.lower()
    now = format_time()

    if stato == "on":

        embed = discord.Embed(
            title="🟢 SERVER ONLINE",
            color=discord.Color.green(),
            description=(
                "**Server ON**\n"
                "Il server è on insieme alla moderazione buon rp e divertimento dallo staff di sud italy rp\n\n"
                "```yaml\n"
                "🔥 CODICE SERVER: v90mci1k 🔥\n"
                "```\n"
                f"Data: {now}"
            )
        )

    elif stato == "off":

        embed = discord.Embed(
            title="🔴 SERVER OFFLINE",
            color=discord.Color.red(),
            description=(
                "Il server è offline per entrare bisognerà aspettare il prossimo ssu, lo staff non ha nessuna responsabilità durante la chiusura\n\n"
                f"Data: {now}"
            )
        )
    else:
        return await interaction.response.send_message("Scrivi solo 'on' oppure 'off'", ephemeral=True)

    embed.set_image(url=STATUS_IMAGE)
    await interaction.response.send_message(embed=embed)

# =========================
# RUN
# =========================
bot.run(TOKEN)
