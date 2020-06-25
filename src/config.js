/**
 * App Configuration
 */
module.exports = {
  PORT: process.env.PORT || 7000,
  // why `Do_Not_Disturb`? See https://devforum.zoom.us/t/check-if-a-user-is-on-a-call-or-available/6140/8
  ZOOM_IN_MEETING_STATUS: 'Do_Not_Disturb',
}
