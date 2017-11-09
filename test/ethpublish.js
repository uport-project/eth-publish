var EthPublish = artifacts.require("./EthPublish.sol")
var lightwallet = require('eth-lightwallet')
const solsha3 = require('solidity-sha3').default
const leftPad = require('left-pad')
// const Promise = require('bluebird')
// const BigNumber = require('bignumber.js')

//const web3SendTransaction = Promise.promisify(web3.eth.sendTransaction)
//const web3GetBalance = Promise.promisify(web3.eth.getBalance)

contract('EthPublish', function(accounts) {

  let keyFromPw
  let acct
  let lw
  let ethPublish

let createSig = function(contractAddress, publisherAddress, nonce, data) {

  // '6574682d7075626c697368' is the string "eth-publish"
  let input = '0x19' + '00' + contractAddress.slice(2) + '6574682d7075626c697368' + leftPad(nonce.toString('16'), '64', '0') + publisherAddress.slice(2) + data.slice(2)
  let hash = solsha3(input)

  let sig = lightwallet.signing.signMsgHash(lw, keyFromPw, hash, publisherAddress)
  let sigV = sig.v
  let sigR = ('0x' + sig.r.toString('hex'))
  let sigS = ('0x' + sig.s.toString('hex'))

  return {sigV: sigV, sigR: sigR, sigS: sigS}
}

let testPublishSuccess = async function(contractAddress, publisherAddress, nonce, data, done) {

  // check correct nonce
  let ctrNonceBefore = await ethPublish.nonce.call(publisherAddress)
  assert.equal(ctrNonceBefore.toNumber(), nonce)

  let sig = createSig(contractAddress, publisherAddress, nonce, data)
  await ethPublish.publish(sig.sigV, sig.sigR, sig.sigS, publisherAddress, data, {from: accounts[0]})

  let ctrNonceAfter = await ethPublish.nonce.call(publisherAddress)
  assert.equal(ctrNonceAfter.toNumber(), nonce+1)

  let ctrPublishedData = await ethPublish.publishedData.call(publisherAddress)
  assert.equal(ctrPublishedData, data)

  done()
}

let testPublishFailureWrongSigner = async function(contractAddress, publisherAddress, signerAddress, nonce, data, done) {

  // check correct nonce
  let ctrNonceBefore = await ethPublish.nonce.call(publisherAddress)
  assert.equal(ctrNonceBefore.toNumber(), nonce)

  let sig = createSig(contractAddress, signerAddress, nonce, data)

  var errMsg = ''
  try {
    // should throw an error
    await ethPublish.publish(sig.sigV, sig.sigR, sig.sigS, publisherAddress, data, {from: accounts[0]})
  }
  catch(error) {
    errMsg = error.message
  }

  assert.equal(errMsg, 'VM Exception while processing transaction: invalid opcode', 'Test did not throw as expected')

  // Nonce should not change on failure
  let ctrNonceAfter = await ethPublish.nonce.call(publisherAddress)
  assert.equal(ctrNonceAfter.toNumber(), nonce)

  let ctrPublishedData = await ethPublish.publishedData.call(publisherAddress)
  assert.equal(ctrPublishedData, '0x')

  done()
}


// let executeSendFailure = async function(owners, threshold, signers, done) {

//   let multisig = await SimpleMultiSig.new(threshold, owners, {from: accounts[0]})

//   let nonce = await multisig.nonce.call()
//   assert.equal(nonce.toNumber(), 0)

//   // Receive funds
//   await web3SendTransaction({from: accounts[0], to: multisig.address, value: web3.toWei(new BigNumber(2), 'ether')})

//   let randomAddr = solsha3(Math.random()).slice(0,42)
//   let value = web3.toWei(new BigNumber(0.1), 'ether')
//   let sigs = createSigs(signers, multisig.address, nonce, randomAddr, value, '0x')

//   let errMsg = ''
//   try {
//   await multisig.execute(sigs.sigV, sigs.sigR, sigs.sigS, randomAddr, value, '0x', {from: accounts[0], gasLimit: 1000000})
//   }
//   catch(error) {
//     errMsg = error.message
//   }

//   assert.equal(errMsg, 'VM Exception while processing transaction: invalid opcode', 'Test did not throw')

//   done()
// }

// let creationFailure = async function(owners, threshold, signers, done) {

//   try {
//     await SimpleMultiSig.new(threshold, owners, {from: accounts[0]})
//   }
//   catch(error) {
//     errMsg = error.message
//   }

//   assert.equal(errMsg, 'VM Exception while processing transaction: invalid opcode', 'Test did not throw')

//   done()
// }

  beforeEach((done) => {

    let seed = "pull rent tower word science patrol economy legal yellow kit frequent fat"

    lightwallet.keystore.createVault(
    {hdPathString: "m/44'/60'/0'/0",
     seedPhrase: seed,
     password: "test",
     salt: "testsalt"
    },
    function (err, keystore) {

      lw = keystore
      lw.keyFromPassword("test", function(e,k) {
        keyFromPw = k

        lw.generateNewAddress(keyFromPw, 20)
        let acctWithout0x = lw.getAddresses()
        acct = acctWithout0x.map((a) => {return '0x'+a})
        EthPublish.new({from: accounts[0]}).then( (ep) => {
          ethPublish = ep
          done()
        })
      })
    })
  })

  describe("Publisher", () => {

    it("should succeed", async function () {
      
      let publisher = acct[0]
      let publisher1 = acct[1]
      let data0 = '0xaabbccddeeff'
      let data1 = '0x001122334455667788aaaaaaaabbbbbbbbcccccccc111111112222222233333333111111112222222233333333111111112222222233333333111111112222222233333333111111112222222233333333111111112222222233333333111111112222222233333333111111112222222233333333'
      let data2 = '0xaa'
      await testPublishSuccess(ethPublish.address, publisher, 0, data0, () => {})
      await testPublishSuccess(ethPublish.address, publisher, 1, data1, () => {})
      await testPublishSuccess(ethPublish.address, publisher, 2, data2, () => {})
      await testPublishSuccess(ethPublish.address, publisher1, 0, data1, () => {})
    })

    it("should fail on wrong signer", async function () {
      
      let publisher = acct[0]
      let signer = acct[1]
      let data0 = '0xaabbccddeeff'

      await testPublishFailureWrongSigner(ethPublish.address, publisher, signer, 0, data0, () => {})

    })
  })





})
