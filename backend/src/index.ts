import FireFly, { FireFlySubscriptionBase } from "@hyperledger/firefly-sdk";
import express from "express";
import bodyparser from "body-parser";
import can from "../contracts/can.json";
import { v4 as uuidv4 } from "uuid";
import { CrushLabel } from "./label";

const PORT = 4001;
const HOST = "http://localhost:5000";
const NAMESPACE = "default";
const app = express();
const firefly = new FireFly({
  host: HOST,
  namespace: NAMESPACE,
});

let apiName: string;

app.use(bodyparser.json());

app.post("/api/label", async (req,res)=>{
  try{
    const label=CrushLabel.fromLabelString(req.body.label);

    try {
    const fireflyRes = await firefly.invokeContractAPI(apiName, "mintWithID", {
      input: {
        uniqueID: label.tokenId,
      },
    });
    } catch (e:any){
      if (e.message.includes("ERC721InvalidSender")){
        res.status(409).send({
          tokenId: label.tokenId,
        });
        return;
      }
    }
    
    res.status(201).send({
      tokenId: label.tokenId,
    });
  }catch (e: any) {
    res.status(500).send({
      error: e.message,
    });
  }
});

app.get("/api/label/:label",async (req, res)=>{
  try{
    const label=CrushLabel.fromLabelString(req.params.label);

    var status="UNKNOWN"
    try{
      const fireflyRes = await firefly.queryContractAPI(apiName, "getApproved", {
        input: {
          tokenId: label.tokenId,
        },
      });

      if (fireflyRes.output==="0x0000000000000000000000000000000000000000"){
        status="DEPOSITED"
      }
      if (fireflyRes.output==="0x0000000000000000000000000000000000000001"){
        status="REDEEMED"
      }
    }
    catch (e:any){
      if (e.message.includes("ERC721NonexistentToken")){
        status="NO_DEPOSIT"
      }
      else{
        throw e;
      }
    }

    res.status(200).send({
      tokenId: label.tokenId,
      status: status,
    })
  }catch (e: any) {
    res.status(500).send({
      error: e.message,
    });
  }
});

app.put("/api/label/:label",async (req, res)=>{
  try{
    // This endpoint only supports redeeming deposits right now.
    if (req.body.status!=="REDEEMED"){
      res.status(400).send({
        error:"invalid_target_status"
      });
      return;
    }

    const label=CrushLabel.fromLabelString(req.params.label);

    try{
      // Read the existing status from the "Approval" data.
      const getRes = await firefly.queryContractAPI(apiName, "getApproved", {
        input: {
          tokenId: label.tokenId,
        },
      });
      if (getRes.output!=="0x0000000000000000000000000000000000000000"){
        res.status(409).send({
          tokenId: label.tokenId,
          error: "invalid_status"
        });
        return;
      }
    } catch (e:any){
      if (e.message.includes("ERC721NonexistentToken")){
        res.status(400).send({
          tokenId: label.tokenId,
          error: "deposit_not_found"
        });
        return;
      } else {
        throw e;
      }
    }

    // Set the new status
    const fireflyRes = await firefly.invokeContractAPI(apiName, "approve", {
      input: {
        tokenId: label.tokenId,
        to: "0x01",
      }
    })
    res.status(200).send({
      tokenId: label.tokenId,
      approved: fireflyRes.output,
    })

  }catch (e: any) {
    res.status(500).send({
      error: e.message,
    });
  }
});


async function init() {
  const deployRes = await firefly.deployContract(
    {
      definition:
        can.contracts["can.sol:UniqueIDNFT"].abi,
      contract: can.contracts["can.sol:UniqueIDNFT"].bin,
      input: [],
    },
    { confirm: true }
  );
  const contractAddress = deployRes.output.contractLocation.address;

  const generatedFFI = await firefly.generateContractInterface({
    name: uuidv4(),
    namespace: NAMESPACE,
    version: "1.0",
    description: "Auto-deployed CAN contract",
    input: {
      abi: can.contracts["can.sol:UniqueIDNFT"].abi,
    },
  });

  const contractInterface = await firefly.createContractInterface(
    generatedFFI,
    { confirm: true }
  );

  const contractAPI = await firefly.createContractAPI(
    {
      interface: {
        id: contractInterface.id,
      },
      location: {
        address: contractAddress,
      },
      name: uuidv4(),
    },
    { confirm: true }
  );

  apiName = contractAPI.name;

  // const listener = await firefly.createContractAPIListener(apiName, "Changed", {
  //   topic: "changed",
  // });

  firefly.listen(
    {
      filter: {
        events: "blockchain_event_received",
      },
    },
    async (socket, event) => {
      console.log(event.blockchainEvent?.output);
    }
  );

  // Start listening
  app.listen(PORT, () =>
    console.log(`Crush DApp backend listening on port ${PORT}!`)
  );
}

init().catch((err) => {
  console.error(err.stack);
  process.exit(1);
});

module.exports = {
  app,
};
