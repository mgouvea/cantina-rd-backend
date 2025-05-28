const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com MongoDB Atlas...');
    console.log(`👤 DB_USER: ${process.env.DB_USER}`);
    console.log(`🔑 DB_PASS: ${process.env.DB_PASS ? '***' : 'MISSING'}`);

    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ldjep.mongodb.net/cantina-rd?retryWrites=true&w=majority&appName=Cluster0`;

    console.log('🔗 URI:', uri.replace(process.env.DB_PASS, '***'));

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });

    console.log('✅ Conexão com MongoDB estabelecida com sucesso!');

    // Testar uma operação simples
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(`📊 Collections encontradas: ${collections.length}`);

    await mongoose.disconnect();
    console.log('✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);

    if (error.message.includes('IP')) {
      console.error(
        '💡 Solução: Adicione o IP do servidor na whitelist do MongoDB Atlas',
      );
    }

    process.exit(1);
  }
}

testConnection();
