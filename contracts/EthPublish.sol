pragma solidity ^0.4.14;

contract EthPublish {

  mapping(address => uint) public nonce;
  mapping(address => bytes) public publishedData;

  function publish(uint8 sigV, bytes32 sigS, bytes32 sigR, address publisher, bytes data) {
    bytes32 hash = keccak256(byte(0x19), byte(0), this, "eth-publish", nonce[publisher], publisher, data);
    require(ecrecover(hash, sigV, sigS, sigR) == publisher);
    nonce[publisher]++;
    publishedData[publisher] = data;
  }
}
