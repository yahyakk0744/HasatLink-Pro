import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function makeAdmin() {
  const email = process.argv[2] || 'yahyakk0744@gmail.com';
  const uri = process.env.MONGODB_URI!;

  console.log('MongoDB\'ye bağlanılıyor...');
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });

  try {
    await client.connect();
    console.log('MongoDB bağlandı');

    const db = client.db('hasatlink');

    // Önce kullanıcıyı bul
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      console.log(`❌ ${email} bulunamadı! Tüm kullanıcıları listeliyorum:`);
      const allUsers = await db.collection('users').find({}, { projection: { email: 1, name: 1, role: 1 } }).toArray();
      allUsers.forEach(u => console.log(`  - ${u.email} (${u.name}) [role: ${u.role}]`));
      return;
    }

    console.log(`Mevcut: ${user.name} (${user.email}) [role: ${user.role}]`);

    // Admin yap
    await db.collection('users').updateOne(
      { email },
      { $set: { role: 'admin' } }
    );

    console.log(`✅ ${email} artık admin!`);
  } finally {
    await client.close();
  }
}

makeAdmin().catch(console.error);
