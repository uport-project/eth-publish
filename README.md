# eth-publish

This repo defines a smart contract, `EthPublish` which allows the publishing of data associated to an Ethereum address. An Ethereum address is the Keccak-256 hash of a secp256k1 elliptic curve public key, truncated to 20 bytes. 

The functionality is very similar to the IPNS functionality of [IPFS](https://ipfs.io) whereby data is published and associated with the hash of a public key defining the node ID of an IPFS node.

The contract accepts a signature, a publisher in the form of an Ethereum address and data in `bytes` form. If the signature validates the contract will store the mapping from Ethereum address to data.

The signature is taken over the hash of the following:

```
<0x19> <0x00> <EthPublish contract address> <string "eth-publish"> <nonce of publisher address> <publisher address>, <data>
```

An incrementing nonce is used to prevent replay attacks where an adversary uses a past signature to republish old data.
