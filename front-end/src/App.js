import './App.css';
import React, { useEffect, useState } from 'react';
import idl from './idl.json';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

// Create a keypair for the account that will hold the GIF data.
let baseAccount = Keypair.generate();

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [tickets, setTickets] = useState(0);
  const [helper, setHelper] = useState(false)


  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');

          const response = await solana.connect({ onlyIfTrusted: true })
          setWalletAddress(response.publicKey.toString())

          console.log(`connted with public key ${response.publicKey.toString()}`);
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const sendBuyTicketRequest = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.buyTicket({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log(`succesfulyl bought ticket`);
      await getTicketAmount();

    } catch (error) {
      console.log(`error buying tickets`);
    }
  }

  const getTicketAmount = async () => {
    console.log(`calling get ticket amount`);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log(account.totalTickets.toString());
      console.log("Got the account", account)
      setTickets(account.totalTickets.toString())

    } catch (error) {
      console.log("Error in getGifList: ", error)
      setTickets(0);

    }
  }

  //TO-DO Function to buy multiple tokens
  // const buyTokens = async () => {
  //   if (inputValue.length === 0) {
  //     alert("Please enter an valid amount")
  //     return
  //   }

  //   if (typeof inputValue !== 'number') {
  //     alert("Please enter an valid amount")
  //     return
  //   }

  //   setInputValue('');
  //   console.log('Gif link:', inputValue);
  //   try {
  //     const provider = getProvider();
  //     const program = new Program(idl, programID, provider);

  //     await program.rpc.addGif(inputValue, {
  //       accounts: {
  //         baseAccount: baseAccount.publicKey,
  //         user: provider.wallet.publicKey,
  //       },
  //     });
  //     console.log("Succesfully bought Token(s)", inputValue)

  //   } catch (error) {
  //     console.log("Error :", error)
  //   }
  // };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const createTicketAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      console.log(baseAccount);
      setHelper(true)

    } catch (error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => {

    if (helper === false) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createTicketAccount}>
            Initializate a new Account
          </button>
        </div>
      )
    } else {
      return (
        <div>
          <div className="connected-container">

            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendBuyTicketRequest();
              }}
            >
              <input
                type="text"
                placeholder="Amount"
                value={inputValue}
                onChange={onInputChange}
              />
              <button type="submit" className="cta-button submit-gif-button">
                Buy Tickets
              </button>
            </form>
          </div>
        </div>
      )
    }
  }

  useEffect(() => {
    console.log(`Hey from useEffect`);
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);


  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getTicketAmount()
    }
  }, [walletAddress]);

  useEffect(() => {
    console.log(`helper changed`);
    //getTicketAmount();

  }, [helper]);



  return (

    <div className="Main">
      {!walletAddress && renderNotConnectedContainer()}
      <div className="App">
        <div className="container">
          <div className="header-container">
            <p className="header gradient-text-red"> SoLucky Lottery </p>
            <p className="sub-text">
              Awesome lottery app on Solana✨
            </p>
            <p className="sub-text">
              Your amount of tickets: {tickets}
            </p>
            {console.log(window)}

            {/* We just need to add the inverse here! */}
            {walletAddress && renderConnectedContainer()}
          </div>
          <div className="footer-container">
            <a
              className="footer-text"
            >{`Built by Team 5 @ Encode `}</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
