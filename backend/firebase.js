const admin = require("firebase-admin");

let db = null;

try {
  const serviceAccount = require("./serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  db = admin.firestore();
} catch (error) {
  console.warn(
    "Firebase ainda não foi configurado. serviceAccountKey.json não encontrado ou erro ao inicializar Firebase."
  );
}

module.exports = {
  db,
};
