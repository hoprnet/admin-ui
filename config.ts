export const environment: 'dev' | 'node' | 'web3' = 'dev';

// Smart Contracts
export const HOPR_CHANNELS_SMART_CONTRACT_ADDRESS = '0xfabee463f31e39ec8952bbfb4490c41103bf573e';
export const mHOPR_TOKEN_SMART_CONTRACT_ADDRESS = '0x66225dE86Cac02b32f34992eb3410F59DE416698';
export const xHOPR_TOKEN_SMART_CONTRACT_ADDRESS = '0xD057604A14982FE8D88c5fC25Aac3267eA142a08';
export const wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS = '0xD4fdec44DB9D44B8f2b6d529620f9C0C7066A2c1';
export const wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS = '0x097707143e01318734535676cfe2e5cF8b656ae8';
export const GNOSIS_CHAIN_HOPR_BOOST_NFT = '0x43d13d7b83607f14335cf2cb75e87da369d056c7';

// App
export const HOPR_TOKEN_USED = 'wxHOPR';
export const HOPR_TOKEN_USED_CONTRACT_ADDRESS = wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS;

// Safe Contracts
export const SAFE_SERVICE_URL = 'https://safe-transaction.stage.hoprtech.net';
export const HOPR_NODE_STAKE_FACTORY = '0xa2e2F71f687914f5DC2010632bC2dEbB1B9FC1D5';
export const HOPR_NODE_MANAGEMENT_MODULE = '0xb3B09FA6504F9d59F1a9740F68f3E904ca857A82';
export const HOPR_NODE_SAFE_REGISTRY = '0x3E7c4720934ff6A9FE122Cb761f36a11E9b848D9';
export const HOPR_NETWORK_REGISTRY = '0x2f3243adC9805F6dd3E01C9E9ED31675A5B16902';

//Subgraphs
export const STAKE_SUBGRAPH = 'https://api.studio.thegraph.com/query/40439/hopr-stake-all-seasons/v0.0.10';
export const STAKING_V2_SUBGRAPH = 'https://api.studio.thegraph.com/query/40438/subgraph-dufour/version/latest';
//export const STAKING_V2_SUBGRAPH = 'https://api.studio.thegraph.com/proxy/40438/test-dufour/version/latest';

// Wallet Connect
export const VITE_WALLET_CONNECT_PROJECT_ID = 'efdce6b5c6b10913211ff1b40bc4d54d';

// Minimum to be funded
export const MINIMUM_WXHOPR_TO_FUND = 0.01;
export const MINIMUM_XDAI_TO_FUND = 0.01;
export const MINIMUM_XDAI_TO_FUND_NODE = 0.001;
