const Web3 = require('web3')
const repl = require('repl')
const Token = require('computable/dist/contracts/erc-20').default
const deployDll = require('computable/dist/helpers').deployDll
const deployAttributeStore = require('computable/dist/helpers').deployAttributeStore
const Voting = require('computable/dist/contracts/plcr-voting').default
// const Parameterizer = require('computable/dist/contracts/parameterizer').default
// const Registry = require('computable/dist/contracts/registry').default

// so this shit blew the fuck up... TODO come back to this later
// const child = require('child_process')

/**
 * ganache specific constants
 */
const PORT = 8546
// set a very low gas price
const GAS_PRICE = '0x01'
// set a very high gas limit
const GAS_LIMIT = '0xfffffffffff'

/**
 * Web3
 */
const provider = new Web3.providers.WebsocketProvider(`ws://localhost:${PORT}`)

/**
 * TRC specific constants
 * TODO we could use a settings file or something for users to customize if needed
 */
const TWO_BILLION = 2000000000
const ONE_MILLION = 1000000

const replServer = repl.start({ prompt: 'Computable > ' })
replServer.context.web3 = new Web3(provider)

const setup = async () => {
  // accounts
  replServer.context.accounts = await replServer.context.web3.eth.getAccounts()

  replServer.context.admin = replServer.context.accounts[0]
  replServer.context.user1 = replServer.context.accounts[1]
  replServer.context.user2 = replServer.context.accounts[2]
  replServer.context.user3 = replServer.context.accounts[3]
  replServer.context.user4 = replServer.context.accounts[4]

  // token
  replServer.context.token = new Token(replServer.context.admin)

  await replServer.context.token.deploy(replServer.context.web3, {
    address: replServer.context.admin,
    supply: TWO_BILLION // 2 billion whatevers
  }, { gas: GAS_LIMIT, gasPrice: GAS_PRICE })

  await replServer.context.token.transfer(replServer.context.user1, ONE_MILLION)
  await replServer.context.token.transfer(replServer.context.user2, ONE_MILLION)
  await replServer.context.token.transfer(replServer.context.user3, ONE_MILLION)
  await replServer.context.token.transfer(replServer.context.user4, ONE_MILLION)

  // voting
  replServer.context.dll = await deployDll(replServer.context.web3, replServer.context.admin)
  replServer.context.attributeStore = await deployAttributeStore(replServer.context.web3, replServer.context.admin)
  replServer.context.voting = new Voting(replServer.context.admin)

  await replServer.context.voting.deploy(replServer.context.web3, {
    tokenAddress: replServer.context.token.getAddress(),
    dllAddress: replServer.context.dll.options.address,
    attributeStoreAddress: replServer.context.attributeStore.options.address
  }, { gas: GAS_LIMIT, gasPrice: GAS_PRICE })
}

replServer.context.log = promise => {
  promise.then(ret => console.log(ret))
  return '...'
}

setup()
