const http = require('http');
const port = process.env.PORT || 3000;
http.createServer((req, res) => res.end('Bot WhatsApp VIP Zikoone en ligne !')).listen(port);
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const axios = require('axios');
const qrcode = require('qrcode-terminal');

// URL officielle de ton Worker Cloudflare
const WORKER_URL = "https://zikooneverification.lucsckoba.workers.dev"; 

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_session');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log("=== SCANNE CE QR CODE AVEC WHATSAPP ===");
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connexion fermée. Reconnexion...', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('✅ Bot WhatsApp connecté avec succès !');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();

    // 1. DEMANDE DE SIGNAL ("Signal" ou "🚀 Prochain Signal")
    if (text.toLowerCase() === "signal" || text === "🚀 Prochain Signal") {
      try {
        const res = await axios.get(`${WORKER_URL}/api/get-signal`);
        const { signal, session, status } = res.data;

        if (status === "empty") {
          let nextMsg = session === "matin" ? "midi" : session === "midi" ? "ce soir" : "demain matin";
          await sock.sendMessage(from, { text: `⏳ Les signaux de la session actuelle ne sont pas encore prêts. Revenez à ${nextMsg} !` });
        } else if (status === "finished") {
          await sock.sendMessage(from, { text: `🏁 **Session ${session} terminée !**\nRevenez pour la prochaine session.` });
        } else if (signal) {
          const reply = `🎯 *SIGNAL VIP LUCKY JET*\n\n` +
                        `⏰ *Heure du vol :* \`${signal.time}\`\n` +
                        `📈 *Cote visée :* \`${signal.cote}\`\n\n` +
                        `⚠️ *Patiente jusqu'à l'heure exacte avant de placer ton pari.*`;
          await sock.sendMessage(from, { text: reply });
        }
      } catch (e) {
        await sock.sendMessage(from, { text: "⚠️ Une erreur est survenue lors de la récupération du signal." });
      }
      return;
    }

    // 2. VERIFICATION ID JOUEUR (Chiffres uniquement)
    if (/^\d+$/.test(text)) {
      try {
        const res = await axios.post(`${WORKER_URL}/api/check-id`, { userId: text });
        if (res.data.status === "active") {
          await sock.sendMessage(from, { 
            text: "✅ *COMPTE VÉRIFIÉ !*\n\nTon dépôt est confirmé. Envoie le mot *Signal* à tout moment pour recevoir ton prochain signal !" 
          });
        } else if (res.data.status === "pending") {
          await sock.sendMessage(from, { 
            text: "⚠️ *DÉPÔT NON DÉTECTÉ*\n\nTon inscription est validée mais ton premier dépôt n'est pas encore confirmé." 
          });
        } else {
          await sock.sendMessage(from, { 
            text: "❌ *ACCÈS REFUSÉ*\n\nCet ID n'a pas été trouvé. Inscris-toi avec le code *ZIKOONE* et fais un dépôt." 
          });
        }
      } catch (e) {
        await sock.sendMessage(from, { text: "⚠️ Erreur lors de la vérification de l'ID." });
      }
      return;
    }

    // Message par défaut
    await sock.sendMessage(from, { text: "👋 Envoie ton *ID Joueur* (ex: 8493021) pour activer tes accès VIP, ou envoie *Signal* pour recevoir la cote." });
  });
}

startBot();
