function formatDateTimeWIB(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return `${formatter.format(new Date(date))} WIB`;
}

function formatDateWIB(date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(date));
}

module.exports = { formatDateTimeWIB, formatDateWIB };
