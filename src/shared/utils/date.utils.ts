import { DashDate } from '../types/dashDate.type';

/**
 * Converte e valida strings de data para um objeto DashDate
 * @param startDate String da data inicial
 * @param endDate String da data final
 * @returns Objeto DashDate com datas validadas
 */
export function parseDateRange(startDate: string, endDate: string): DashDate {
  let parsedStartDate: Date;
  let parsedEndDate: Date;

  // Se startDate não for fornecido ou for inválido, use o primeiro dia do mês atual
  if (!startDate) {
    const now = new Date();
    parsedStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    parsedStartDate = new Date(startDate);
    // Verificar se a data é válida
    if (isNaN(parsedStartDate.getTime())) {
      const now = new Date();
      parsedStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  // Se endDate não for fornecido ou for inválido, use a data atual
  if (!endDate) {
    parsedEndDate = new Date();
  } else {
    parsedEndDate = new Date(endDate);
    // Verificar se a data é válida
    if (isNaN(parsedEndDate.getTime())) {
      parsedEndDate = new Date();
    }
  }

  return {
    startDate: parsedStartDate,
    endDate: parsedEndDate,
  };
}
