/*
 * Ideally we want to spin off the TestRPC in a background thread from the REPL and not
 * have to run 2 console tabs. In the meantim tho...
 *
 */

const PORT = 8546

const opts = {
  mnemonic: 'source salon source blast nest wife symptom useless picture emerge play twist',
  total_accounts: 5, // provides for an admin/owner and 4 users
  gasPrice: '0x01', // use a low gas price
  gasLimit: '0xfffffffffff', // use a high gas limit
  ws: true // use websocket enabled server
}

const ganache = require('ganache-cli')
const server = ganache.server(opts)

server.listen(PORT)
