// sum.test.js
import { expect, test } from 'vitest'
import { CrushLabel } from './label'

// Simple test case
const upc="067000007248";
const uuid="68428176-63c7-4057-9b31-3bf9c6012b0d";
const labelString="25CMEEjKWFfPKkyi1bWrioy45jEQs9coDQSRoXD";
const tokenId="6842817663c740579b313bf9c6012b0d0000000f9982fa5000000000";

test('fromText', () => {
  const label=CrushLabel.fromLabelString(labelString);
  expect(label.uuidString).toBe(uuid);
  expect(label.upcString).toBe(upc);
  expect(label.labelString).toBe(labelString);
  expect(label.tokenId).toBe(tokenId);
});

test('fromDetail',()=>{
  const label=CrushLabel.fromDetails(uuid,upc);
  expect(label.uuidString).toBe(uuid);
  expect(label.upcString).toBe(upc);
  expect(label.labelString).toBe(labelString);
  expect(label.tokenId).toBe(tokenId);
})

test('fromDetail invalid UPC',()=>{
  expect(()=>CrushLabel.fromDetails(uuid,"123456789013")).toThrow(RangeError);
})

test('fromTokenId',()=>{
  const label=CrushLabel.fromTokenId(tokenId);
  expect(label.uuidString).toBe(uuid);
  expect(label.upcString).toBe(upc);
  expect(label.labelString).toBe(labelString);
  expect(label.tokenId).toBe(tokenId);
})