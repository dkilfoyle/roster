library(stringr)
library(readxl)
library(dplyr)
library(lubridate)
library(purrr)
library(tidyr)

isWeekday = function(x) {
  return (!wday(x, label=TRUE) %in% c("Sat", "Sun"))
}

loadMonth = function(myyear, mymonth, startDate, weeks) {
  fileName = paste0(myyear,"-", str_pad(mymonth, 2, "left", "0"), ".xlsx")
  x = read_excel(fileName)
  dates = startDate + days(x=seq.int(0,weeks*7-1))
  dates = keep(dates, isWeekday)
  
  names(x)[3:length(names(x))] = format(dates)

  y = x %>%
    pivot_longer(cols=1:length(dates)+2, names_to="date", values_to="activity") %>%
    mutate(
      date = as.Date(date),
      activity = recode(activity, `AL` = "AL"),
      smo = recode(smo, 
                   `Neil Anderson` = "NA",
                   `Alan Barber` = "AB",
                   `Peter Bergin` = "PB",
                   `Alison Charleston` = "AC",
                   `Nicholas Child` = "NC",
                   `Richard Frith` = "RF",
                   `Rosamund Hill` = "RH",
                   `David Hutchinson` = "DH",
                   `Dean Kilfoyle` = "DK",
                   `Jennifer Pereira` = "JP",
                   `Richard Roxburgh` = "RR",
                   `Mark Simpson` = "MS",
                   `Barry Snow` = "BS",
                   `Elizabeth Walker` = "ElW",
                   `Edward Wong` = "EdW",
                   `Ernie Willoughby` = "ErW",
                   `Julian Bauer` = "JB",
                   `Justin Kao` = "JK",
                   `Pyari Bose` = "PyB",
                   `Viswas Dayal` = "VD",
                   `Sunayana Sasikumar` = "SS",
                   `David McAuley` = "DM",
                   `Petina Newton` = "PN",
                   `Petina Newton (Neuropsychologist)` = "PN",
                   `Suzanne Davis` = "SD",
                   `Lalit Kalra` = "LK",
                   `Lalit Kalra or Adele McMahon` = "AM",
                   `Adele McMahon` = "AM",
                   `Suzanne Davis` = "SD",
                   )
    ) %>% 
    filter(!is.na(activity)) %>% 
    mutate(
      smo1 = ifelse(smo == "Call", activity, smo),
      activity1 = ifelse(smo == "Call", smo, activity)
    ) %>%
    select(date, time, smo=smo1, activity=activity1)
  
  return (y)
}

roster = loadMonth(2020, 10, ymd("2020-10-05"), 4)
roster = rbind(roster, loadMonth(2020, 11, ymd("2020-11-02"), 4))
roster = rbind(roster, loadMonth(2020, 12, ymd("2020-11-30"), 5))
roster = rbind(roster, loadMonth(2021, 1,  ymd("2021-01-04"), 4))
roster = rbind(roster, loadMonth(2021, 2,  ymd("2021-02-01"), 4))
roster = rbind(roster, loadMonth(2021, 3,  ymd("2021-03-01"), 4))
roster = rbind(roster, loadMonth(2021, 4,  ymd("2021-03-29"), 5))
roster = rbind(roster, loadMonth(2021, 5,  ymd("2021-05-03"), 4))
roster = rbind(roster, loadMonth(2021, 6,  ymd("2021-05-31"), 5))
roster = rbind(roster, loadMonth(2021, 7,  ymd("2021-07-05"), 4))
roster = rbind(roster, loadMonth(2021, 8,  ymd("2021-08-02"), 4))
roster = rbind(roster, loadMonth(2021, 9,  ymd("2021-08-30"), 5))
roster = rbind(roster, loadMonth(2021, 10, ymd("2021-10-04"), 4))

jsonlite::write_json(roster, "rosterData.json")
