const Web3 = require('web3')
const repl = require('repl')
const Token = require('computable/dist/contracts/erc-20').default
const deployDll = require('computable/dist/helpers').deployDll
const deployAttributeStore = require('computable/dist/helpers').deployAttributeStore
const Voting = require('computable/dist/contracts/plcr-voting').default
const Parameterizer = require('computable/dist/contracts/parameterizer').default
const Registry = require('computable/dist/contracts/registry').default
const stringToBytes = require('computable/dist/helpers').stringToBytes
const increaseTime = require('computable/dist/helpers').increaseTime
const eventReturnValues = require('computable/dist/helpers').eventReturnValues
const onData = require('computable/dist/helpers').onData

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
// defaults for the P11r
const THREE_MINUTES = 180
const HALF = 50

const paramDefaults = {
  minDeposit: 1,
  pMinDeposit: 1,
  applyStageLen: THREE_MINUTES,
  pApplyStageLen: THREE_MINUTES,
  commitStageLen: THREE_MINUTES,
  pCommitStageLen: THREE_MINUTES,
  revealStageLen: THREE_MINUTES,
  pRevealStageLen: THREE_MINUTES,
  dispensationPct: HALF,
  pDispensationPct: HALF,
  voteQuorum: HALF,
  pVoteQuorum: HALF
}

/**
 * Web3
 */
const provider = new Web3.providers.WebsocketProvider(`ws://localhost:${PORT}`)

/**
 * TRC specific constants
 * TODO we could use a settings file or something for users to customize if needed
 */
const TWO_BILLION = 2000000000

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

  replServer.context.dll = await deployDll(replServer.context.web3, replServer.context.admin)
  replServer.context.attributeStore = await deployAttributeStore(replServer.context.web3, replServer.context.admin)

  // voting
  replServer.context.voting = new Voting(replServer.context.admin)
  await replServer.context.voting.deploy(replServer.context.web3, {
    tokenAddress: replServer.context.token.getAddress(),
    dllAddress: replServer.context.dll.options.address,
    attributeStoreAddress: replServer.context.attributeStore.options.address
  }, { gas: GAS_LIMIT, gasPrice: GAS_PRICE })

  // parameterizer
  replServer.context.parameterizer = new Parameterizer(replServer.context.admin)
  await replServer.context.parameterizer.deploy(replServer.context.web3, {
    tokenAddress: replServer.context.token.getAddress(),
    votingAddress: replServer.context.voting.getAddress(),
    ...paramDefaults
  }, { gas: GAS_LIMIT, gasPrice: GAS_PRICE })

  // registry
  replServer.context.registry = new Registry(replServer.context.admin)
  await replServer.context.registry.deploy(replServer.context.web3, {
    tokenAddress: replServer.context.token.getAddress(),
    votingAddress: replServer.context.voting.getAddress(),
    parameterizerAddress: replServer.context.parameterizer.getAddress(),
    name: 'Computable TCR v0.1.0'
  }, { gas: GAS_LIMIT, gasPrice: GAS_PRICE })

  // expose helper(s)
  replServer.context.stringToBytes = stringToBytes
  replServer.context.increaseTime = increaseTime
  replServer.context.eventReturnValues = eventReturnValues
  replServer.context.onData = onData
}

// call with an array of users and an amount of tokens to transfer to them from the token.
// note this amount will be deducted from the admin so if you send to big an amount
// you'll eventually hit a revert (2 billion)
replServer.context.transfer = async (users, amount) => {
  // TODO we can prob make a const type file to hold strings and import them in
  if (!users || !Array.isArray(users)) console.log('You must pass an array of users to the transfer function')
  else if (!amount) console.log('You must specify an amount to transfer')
  else {
    users.forEach(async user => {
      await replServer.context.token.transfer(user, amount)
    })
  }
}

// given an array of contract addresses, an amount and a user address (or an array of them),
// instruct the token that the contract may spend amount on the behalf of user
replServer.context.approve = async (contracts, amount, user) => {
  if (!contracts || !Array.isArray(contracts)) console.log('You must pass an array of contract addresses to the approve function')
  else if (!amount) console.log('You must specify an amount to approve')
  else if (!user) console.log('You must specify a user who is approving the contract(s) to spend')
  else {
    if (Array.isArray(user)) {
      user.forEach(async userAddress => {
        contracts.forEach(async contractAddress => {
          await replServer.context.token.approve(contractAddress, amount, { from: userAddress })
        })
      })
    } else {
      contracts.forEach(async address => {
        await replServer.context.token.approve(address, amount, { from: user })
      })
    }
  }
}

// will print out the value contained in a given promise
replServer.context.log = promise => {
  promise.then(ret => console.log(ret))
  return '...'
}

setup()
