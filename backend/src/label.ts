import {parse, stringify} from 'uuid';
import { base58, hex } from '@scure/base';
import Long from 'long';

export interface LabelDetail{
  upc: string;
  uuid: string;
}

export class CrushLabel{
  private uuid:Uint8Array;
  private upc:Long

  private constructor(uuid:Uint8Array, upc:Long){
    const upcString=upc.toString().padStart(12,"0")
    if (!isValidUPC(upcString)){
      console.error("Invalid UPC code: ",upcString);
      throw new RangeError("Invalid UPC code: "+upcString);
    }
    
    this.uuid=uuid;
    this.upc=upc;
  }

  public static fromLabelString(text:string):CrushLabel{
    const bytes = base58.decode(text);
    const uuidBytes = bytes.subarray(0,16);
    const upcBytes = bytes.subarray(16, 24);
    return new CrushLabel(uuidBytes, Long.fromBytes([...upcBytes]));
  }

  public static fromDetails(uuid:string, upc:string):CrushLabel{
    const uuidBytes = parse(uuid);
    return new CrushLabel(uuidBytes,Long.fromString(upc));
  }

  public static fromTokenId(tokenId:string):CrushLabel{
    const bytes = hex.decode(tokenId);
    const uuidBytes = bytes.subarray(0,16);
    const upcBytes = bytes.subarray(16, 24);
    return new CrushLabel(uuidBytes, Long.fromBytes([...upcBytes]));
  }

  public get uuidString():string{
    return stringify(this.uuid);
  }

  public get upcString():string{
    // Always pad zeroes to make 12 digits.
    return this.upc.toString().padStart(12, "0");
  }

  public get labelString():string{
    return base58.encode(new Uint8Array([...this.uuid, ...this.upc.toBytes(), ...new Uint8Array(4)]));
  }

  public get tokenId():string{
    return "0x"+hex.encode(new Uint8Array([...this.uuid, ...this.upc.toBytes(), ...new Uint8Array(4)]));
  }
}

// TODO:  Check license https://stackoverflow.com/questions/13605340/how-to-validate-a-ean-gtin-barcode-in-javascript
function isValidUPC(value:string) {
    
    // We only allow correct length barcodes
    if (!value.match(/^(\d{8}|\d{12,14})$/)) {
      return false;
    }
  
    const paddedValue = value.padStart(14, '0');
  
    let result = 0;
    for (let i = 0; i < paddedValue.length - 1; i += 1) {
      result += parseInt(paddedValue.charAt(i), 10) * ((i % 2 === 0) ? 3 : 1);
    }
  
    return ((10 - (result % 10)) % 10) === parseInt(paddedValue.charAt(13), 10);
}