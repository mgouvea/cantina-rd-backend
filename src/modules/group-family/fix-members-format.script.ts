/**
 * Este script corrige o formato dos membros nos grupos familiares.
 * Garante que todos os membros estejam armazenados como strings simples.
 *
 * Para executar: npx ts-node src/modules/group-family/fix-members-format.script.ts
 */

import { connect, connection } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const DB_URI = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

async function fixMembersFormat() {
  try {
    // Conectar ao MongoDB
    await connect(DB_URI);
    console.log('Conectado ao MongoDB');

    // Obter a coleção de grupos familiares
    const groupFamilyCollection = connection.db.collection('groupfamilies');

    // Encontrar todos os grupos familiares
    const groupFamilies = await groupFamilyCollection.find({}).toArray();
    console.log(`Encontrados ${groupFamilies.length} grupos familiares`);

    let updatedCount = 0;

    // Processar cada grupo familiar
    for (const groupFamily of groupFamilies) {
      const members = groupFamily.members || [];
      let needsUpdate = false;
      const normalizedMembers = [];

      // Verificar se há membros em formato de objeto
      for (const member of members) {
        if (typeof member === 'object' && member !== null && member.userId) {
          // Membro está no formato de objeto, extrair apenas o userId
          normalizedMembers.push(member.userId);
          needsUpdate = true;
        } else if (typeof member === 'string') {
          // Membro já está no formato correto
          normalizedMembers.push(member);
        }
      }

      // Atualizar o documento se necessário
      if (needsUpdate) {
        await groupFamilyCollection.updateOne(
          { _id: groupFamily._id },
          { $set: { members: normalizedMembers } },
        );
        updatedCount++;
        console.log(`Grupo familiar ${groupFamily._id} atualizado`);
      }
    }

    console.log(`Total de ${updatedCount} grupos familiares atualizados`);
  } catch (error) {
    console.error('Erro ao processar grupos familiares:', error);
  } finally {
    // Fechar a conexão
    await connection.close();
    console.log('Conexão fechada');
  }
}

// Executar o script
fixMembersFormat()
  .then(() => console.log('Script concluído'))
  .catch((err) => console.error('Erro ao executar o script:', err));
