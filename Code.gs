/**
 * Thrive³ — Google Calendar feed (v2)
 * Paste this whole file into your existing project at script.google.com,
 * replacing the old code, then: Deploy → Manage deployments → ✏️ edit → Version: New version → Deploy.
 * Your URL stays the same.
 *
 * v2 adds a "start" parameter so the app's month calendar can show the whole month.
 */
function doGet(e) {
  var days = 7;
  var start = new Date();
  start.setHours(0, 0, 0, 0);
  if (e && e.parameter) {
    if (e.parameter.days) {
      days = Math.min(62, Math.max(1, Number(e.parameter.days) || 7));
    }
    if (e.parameter.start) {
      var parsed = new Date(e.parameter.start + 'T00:00:00');
      if (!isNaN(parsed.getTime())) start = parsed;
    }
  }
  var end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);

  var events = [];
  // Primary calendar. To include more calendars, add lines like:
  // addEvents(CalendarApp.getCalendarById('family06333468799777120173@group.calendar.google.com'), start, end, events);
  addEvents(CalendarApp.getDefaultCalendar(), start, end, events);

  events.sort(function (a, b) { return a.start < b.start ? -1 : 1; });

  return ContentService
    .createTextOutput(JSON.stringify({ events: events }))
    .setMimeType(ContentService.MimeType.JSON);
}

function addEvents(cal, start, end, out) {
  if (!cal) return;
  cal.getEvents(start, end).forEach(function (ev) {
    out.push({
      title: ev.getTitle(),
      start: ev.getStartTime().toISOString(),
      end: ev.getEndTime().toISOString(),
      allDay: ev.isAllDayEvent()
    });
  });
}
