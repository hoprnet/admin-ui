import React, { useState, useEffect, Fragment, useCallback } from 'react';
import styled from '@emotion/styled';
import MuiButton from '@mui/material/Button';

const SButton = styled(MuiButton)`
  font-family: Source Code Pro;
  text-align: center;
  border-color: linear-gradient(#000050, #0000b4);
  border-radius: 20px;
  text-transform: none;
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 45px;
  letter-spacing: 0.25px;
  height: 38px;
  white-space: nowrap;
  width: 100%;
  max-width: 222px;
  @media only screen and (max-width: 530px) {
    display: none;
  }
`;

export default function ChainButton(props) {
  const { connected, chainId, ...rest } = props;

  const switchChain = async () => {
    if (!window.ethereum) return;
    const rawEthereumProvider = window.ethereum;
    try {
      await rawEthereumProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x64' }],
      });
    } catch (error) {
      try {
        if (error.code === 4902) {
          await rawEthereumProvider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x64',
                chainName: 'Gnosis Chain',
                nativeCurrency: {
                  symbol: 'XDAI',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc.gnosischain.com/'],
              },
            ],
          });
        } else {
          console.log(error);
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <SButton
      className={props.className}
      onClick={switchChain}
      variant="outlined"
      disabled={!props.connected}
      {...rest}
    >
      {!props.connected ? (
        'Not connected'
      ) : props.chainId === '0x64' ? (
        <>
          <img src={'../assets/chains/gnosis-chain-icon.svg'} />
          Gnosis Chain
        </>
      ) : (
        'Switch to Gnosis'
      )}
    </SButton>
  );
}
