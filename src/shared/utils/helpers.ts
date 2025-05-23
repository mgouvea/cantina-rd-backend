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
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
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
