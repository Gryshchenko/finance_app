export enum AccountIcon {
    Wallet = 'wallet',
    Wallet2 = 'wallet2',
    Wallet3 = 'wallet3',
    BankCard = 'bankCard',
    BankCard2 = 'bankCard2',
    Cash = 'cash',
    Coin = 'coin',
    CopperCoin = 'copperCoin',
    HandCoin = 'handCoin',
    Funds = 'funds',
    FundsBox = 'fundsBox',
    Safe = 'safe',
    Safe2 = 'safe2',
}
export enum IncomeIcon {
    BNB = 'bnb',
    Exchange = 'exchange',
    ExchangeBox = 'exchangeBox',
    ExchangeFunds = 'exchangeFunds',
    P2P = 'p2p',
}
export enum SpendIcon {
    ShoppingBag = 'shoppingBag',
    ShoppingBag2 = 'shoppingBag2',
    ShoppingBag3 = 'shoppingBag3',
    ShoppingBag4 = 'shoppingBag4',
    ShoppingBasket = 'shoppingBasket',
    ShoppingCart = 'shoppingCart',
    Coupon = 'coupon',
    Discount = 'discount',
    PriceTag = 'priceTag',
    PriceTag2 = 'priceTag2',
    Refund = 'refund',
    Refund2 = 'refund2',
    Store = 'store',
    Store2 = 'store2',
    Gift = 'gift',
}

export enum TransportIcon {
    Bus = 'bus',
    Train = 'train',
    Plane = 'plane',
    Hotel = 'hotel',
    Ticket = 'ticket',
    Ticket2 = 'ticket2',
}

export enum LeisureIcon {
    Restaurant = 'restaurant',
    Restaurant2 = 'restaurant2',
    Drinks = 'drinks',
    Dice = 'dice',
    Gamepad = 'gamepad',
    Baseball = 'baseball',
    Piano = 'piano',
    TV = 'tv',
    MV = 'mv',
}

export enum HealthIcon {
    Hospital = 'hospital',
    Syringe = 'syringe',
    Capsule = 'capsule',
    Service = 'service',
}

export enum TechIcon {
    Phone = 'phone',
    Mail = 'mail',
    Cloud = 'cloud',
    VideoChat = 'videoChat',
}

export enum VIPIcon {
    VIP = 'vip',
    VIPCrown = 'vipCrown',
    VIPCrown2 = 'vipCrown2',
    VIPDiamond = 'vipDiamond',
}

export type CategoryIconType =
    | AccountIcon
    | IncomeIcon
    | SpendIcon
    | TransportIcon
    | LeisureIcon
    | HealthIcon
    | TechIcon
    | VIPIcon
    | 'add';
