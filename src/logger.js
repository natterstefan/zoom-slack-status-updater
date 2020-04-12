/**
 * simple logger util logs to the console with the current timestamp
 */
module.exports = (title, ...args) => {
  console.log(`${title} (${new Date().toISOString()})`, ...args)
}
