const http = require('http');
const port = process.env.PORT || 3000;
http.createServer((req, res) => res.end('Service VIP Zikoone en ligne !')).listen(port);

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const axios = require('axios');
const qrcode = require('qrcode-terminal');

const WORKER_URL = "https://teams-paris-pesa.lucsckoba.workers.dev"; 

async function startService() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_session');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log("=== SCANNE CE QR CODE ===");
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connexion fermée. Reconnexion...', shouldReconnect);
      if (shouldReconnect) startService();
    } else if (connection === 'open') {
      console.log('✅ Service connecté avec succès au Worker !');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();

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
          const reply = `🎯 *SIGNAL VIP*\n\n` +
                        `⏰ *Heure :* \`${signal.time}\`\n` +
                        `📈 *Multiplicateur / Cote :* \`${signal.cote}\`\n\n` +
                        `⚠️ *Patiente jusqu'à l'heure exacte.*\`;
          await sock.sendMessage(from, { text: reply });
        }
      } catch (e) {
        await sock.sendMessage(from, { text: "⚠️ Une erreur est survenue lors de la récupération du signal." });
      }
      return;
    }

    if (/^\d+$/.test(text)) {
      try {
        const res = await axios.post(`${WORKER_URL}/api/check-id`, { userId: text });
        if (res.data.status === "active") {
          await sock.sendMessage(from, { 
            text: "✅ *COMPTE VÉRIFIÉ !*\n\nTon dépôt est confirmé. Envoie le mot *Signal* à tout moment pour recevoir tes multiplicateurs !" 
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
  });
}

startService();
