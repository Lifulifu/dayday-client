
export const date2IsoStr = (date) => date.toISOString().slice(0, 10);

export const date2Str = (date) => (
  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
)

export const str2Date = (dateStr) => (
  new Date(
    Number.parseInt(dateStr.slice(0, 4)),
    Number.parseInt(dateStr.slice(5, 7)) - 1,
    Number.parseInt(dateStr.slice(8, 10))
  )
)

export const isDateStrValid = (dateStr) => {
  return !!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)
}

export const offsetDate = (date, offset) => {
  const newDate = new Date(date.valueOf());
  newDate.setDate(newDate.getDate() + offset);
  return newDate;
}

export const isToday = (date) => date2Str(date) === date2Str(new Date());
