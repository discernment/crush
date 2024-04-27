// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract UniqueIDNFT is ERC721 {

  constructor() ERC721("CAN", "CAN") {

  }

  function mintWithID(uint256 uniqueID) public {
    _safeMint(msg.sender, uniqueID);
  }
}