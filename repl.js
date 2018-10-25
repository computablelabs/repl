const Web3 = require('web3')
const repl = require('repl')
const Token = require('@computable/computablejs/dist/contracts/erc-20').default
const deployDll = require('@computable/computablejs/dist/helpers').deployDll
const deployAttributeStore = require('@computable/computablejs/dist/helpers').deployAttributeStore
const Voting = require('@computable/computablejs/dist/contracts/plcr-voting').default
const Parameterizer = require('@computable/computablejs/dist/contracts/parameterizer').default
const Registry = require('@computable/computablejs/dist/contracts/registry').default
const stringToBytes = require('@computable/computablejs/dist/helpers').stringToBytes
const increaseTime = require('@computable/computablejs/dist/helpers').increaseTime
const eventReturnValues = require('@computable/computablejs/dist/helpers').eventReturnValues
const onData = require('@computable/computablejs/dist/helpers').onData

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
 * TRC specific constants
 * TODO we could use a settings file or something for users to customize if needed
 */
const TWO_BILLION = 2000000000
const replServer = repl.start({ prompt: 'Computable > ' })

/*
 * *** Command ***

  log(token.estimateGas('approve', { from: user1 }, registry.getAddress(), 100))
  log(token.getDeployed().methods.approve(registry.getAddress(), 100).estimateGas())

  log(registry.estimateGas('apply', { from: user1 }, encodedListing, 100, ''))
*/

/**
 * Web3
 */
replServer.context.web3 = new Web3('https://ropsten.infura.io/v3/6517923c842c4d6b8e67f24b69a21b37')

const setup = async () => {
  // accounts
  replServer.context.admin = '0x4D96B018327Df1502f847236AB5Cc710021daD4b'
  replServer.context.user1 = '0xc53a26eeBc45E801795bDA56BC6Ad7D9297515b5'

  replServer.context.encodedListing = replServer.context.web3.utils.toHex('sample listing')

  // token
  replServer.context.token = new Token(replServer.context.admin)
  await replServer.context.token.at(replServer.context.web3, {
    address: '0x88591967CeDBd025c1b8c735fA211555D7530609',
  })

  // voting
  replServer.context.voting = new Voting(replServer.context.admin)
  await replServer.context.voting.at(replServer.context.web3, {
    address: '0xc7a4FcF311146A76ddD9Fdb1e377a35407F3dEBe',
  })

  // parameterizer
  replServer.context.parameterizer = new Parameterizer(replServer.context.admin)
  await replServer.context.parameterizer.at(replServer.context.web3, {
    address: '0xDeA606418B144CB558E9F714E8267e7d16E54218',
  })

  // registry
  replServer.context.registry = new Registry(replServer.context.admin)
  await replServer.context.registry.at(replServer.context.web3, {
    address: '0x6393f424076E2F58E20507569Fe410d7Fc109635',
  })

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
