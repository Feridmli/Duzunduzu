// SeaportUtils.js
import { Seaport } from "@opensea/seaport-js";
import { ethers } from "ethers";

// Proxy kontrakt ünvanı
const PROXY_ADDRESS = "0xProxyAddress"; // <- buraya real proxy ünvanını yaz

// Cüzdan qoşma funksiyası
export async function connectWallet() {
  if (!window.ethereum) throw new Error("MetaMask və ya Wallet yoxdur");
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}

// NFT alışı (fulfill order) funksiyası
export async function fulfillOrder(signer, order) {
  try {
    const seaport = new Seaport(signer, { contractAddress: PROXY_ADDRESS });

    const tx = await seaport.fulfillOrder({
      order: order.seaportOrder,
      accountAddress: await signer.getAddress()
    });

    await tx.wait();
    alert(`NFT #${order.tokenId} alındı ✅`);
  } catch (e) {
    console.error("Fulfill error:", e);
    alert("Alım uğursuz oldu ❌");
  }
}