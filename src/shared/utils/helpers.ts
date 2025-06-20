import slugify from 'slugify';

export const formatName = (fullName: string): string => {
  const names = fullName.split(' ');
  const firstName = names[0].charAt(0).toUpperCase() + names[0].slice(1);
  const lastName =
    names[names.length - 1].charAt(0).toUpperCase() +
    names[names.length - 1].slice(1);
  return `${firstName} ${lastName}`;
};

/**
 * Formata uma data para o padrão DD/MM às HH:MM
 * @param date Data a ser formatada
 * @returns String formatada no padrão DD/MM às HH:MM
 */
export const formatDateTime = (date: Date): string => {
  // Cria uma cópia da data para não modificar a original
  const adjustedDate = new Date(date);

  // Subtrai 3 horas para ajustar o fuso horário
  adjustedDate.setHours(adjustedDate.getHours() - 3);

  const day = adjustedDate.getDate().toString().padStart(2, '0');
  const month = (adjustedDate.getMonth() + 1).toString().padStart(2, '0');
  const hours = adjustedDate.getHours().toString().padStart(2, '0');
  const minutes = adjustedDate.getMinutes().toString().padStart(2, '0');
  return `${day}/${month} às ${hours}:${minutes}`;
};

/**
 * Formata uma data para o padrão DD/MM
 * @param date Data a ser formatada
 * @returns String formatada no padrão DD/MM
 */
export const formatDateShort = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
};

export const sanitizedName = (name: string): string =>
  slugify(name, {
    lower: true,
    strict: true,
  });
